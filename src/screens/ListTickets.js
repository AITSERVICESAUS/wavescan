// ListTickets.js — DROP-IN REPLACEMENT (clean, no merge markers)
// - Uses Tickets_by_events + EventDetails
// - Generates PDF with: Ticket ID, Checked-in Time, QR Code, Status
// - Pulls Checked-in Time using TicketDetail(qr_code) (same method as History enrichment)
// - Shows PDF Options in a centered glass sheet with dark overlay + proper spacing
// - Keeps BottomNavBar

import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

import GradientBackground from '../components/GradientBackground';
import GradientButton from '../components/GradientButton';
import BottomNavBar from '../components/BottomNavBar';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Tickets_by_events from '../api/Tickets_by_events';
import EventDetails from '../api/EventDetails';
import TicketDetail from '../api/TicketDetails';
import getToken from '../api/getToken';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomAlert from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../theme/theme';

class ListTickets extends Component {
  constructor(props) {
    super(props);
    const { eid } = props.route.params;

    this.state = {
      eid: parseInt(eid, 10),

      totalTickets: 0,
      soldTickets: 0,
      usedTickets: 0,
      remainingTickets: 0,
      tickets: [],

      eventFrom: '',
      eventTo: '',

      showCustomAlert: false,
      alertTitle: '',
      alertMessage: '',
      alertType: '',

      showPDFOptions: false,
      pdfFilePath: '',
      enrichingPdf: false,
    };
  }

  async componentDidMount() {
    // make bottom nav usable across pages (History/Scan rely on this)
    await AsyncStorage.setItem('@selectedEid', String(this.state.eid));
    this.initializeData();
  }

  async initializeData() {
    try {
      const token = await getToken();

      const [eventData, eventInfo] = await Promise.all([
        Tickets_by_events(token, this.state.eid),
        EventDetails(token[0], this.state.eid),
      ]);

      if (eventData) {
        this.setState({
          totalTickets: eventData.total_tickets || 0,
          usedTickets: eventData.tickets_checked || 0,
          remainingTickets: eventData.tickets_available || 0,
          soldTickets:
            (eventData.tickets_checked || 0) +
            (eventData.tickets_available || 0),
          tickets: eventData.tickets || [],
          eventFrom: eventInfo?.from || '',
          eventTo: eventInfo?.to || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch ticket/event data:', error);
      this.showCustomAlert('Error', 'Failed to load event details.', 'error');
    }
  }

  showCustomAlert = (title, message, type) => {
    this.setState({
      showCustomAlert: true,
      alertTitle: title,
      alertMessage: message,
      alertType: type,
    });
  };

  hideCustomAlert = () => {
    this.setState({ showCustomAlert: false });
  };

  // -----------------------
  // Helpers for PDF
  // -----------------------
  escapeHtml = (value) => {
    const s = String(value ?? '');
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  formatPdfTime = (value) => {
    if (!value) return '—';
    // Your API returns strings like "July 10, 2025 2:34 pm" so keep if not parseable
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Enrich tickets with checkin_time by calling TicketDetail(qr_code)
   * Same approach as History, but used only for PDF generation.
   */
  ensurePdfTicketTimes = async () => {
    const { tickets, enrichingPdf } = this.state;
    if (!tickets?.length) return [];
    if (enrichingPdf) return tickets;

    // only for scanned tickets (checked/invalid) AND missing checkin_time
    const needs = tickets.filter((t) => {
      const s = String(t.ticket_status || '').toLowerCase().trim();
      return (s === 'checked' || s === 'invalid') && !t.checkin_time && t.qr_code;
    });

    if (!needs.length) return tickets;

    this.setState({ enrichingPdf: true });

    try {
      const updated = [...tickets];
      const BATCH_SIZE = 10;

      for (let i = 0; i < needs.length; i += BATCH_SIZE) {
        const batch = needs.slice(i, i + BATCH_SIZE);

        const results = await Promise.all(
          batch.map(async (t) => {
            try {
              const detail = await TicketDetail(t.qr_code);
              return {
                qr_code: t.qr_code,
                checkin_time: detail?.checkin_time || '',
                ticket_id: detail?.ticket_id ?? t.ticket_id,
                ticket_status: detail?.ticket_status ?? t.ticket_status,
              };
            } catch (e) {
              return { qr_code: t.qr_code, checkin_time: '' };
            }
          }),
        );

        results.forEach((r) => {
          const idx = updated.findIndex((x) => x.qr_code === r.qr_code);
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              ...(r.ticket_id ? { ticket_id: r.ticket_id } : {}),
              ...(r.ticket_status ? { ticket_status: r.ticket_status } : {}),
              checkin_time: r.checkin_time || updated[idx].checkin_time,
            };
          }
        });
      }

      this.setState({ tickets: updated, enrichingPdf: false });
      return updated;
    } catch (e) {
      this.setState({ enrichingPdf: false });
      return tickets;
    }
  };

  // -----------------------
  // PDF generation
  // -----------------------
  generatePdf = async () => {
    const { title } = this.props.route.params;

    // ✅ ensure scan time exists for scanned tickets
    const enrichedTickets = await this.ensurePdfTicketTimes();

    const { soldTickets, usedTickets, remainingTickets, eventFrom, eventTo } = this.state;

    const eventTimeLine =
      eventFrom || eventTo
        ? `${this.escapeHtml(eventFrom)} — ${this.escapeHtml(eventTo)}`
        : '';

    const ticketRows = (enrichedTickets || [])
      .map((ticket, index) => {
        const statusRaw = String(ticket.ticket_status || '').toLowerCase().trim();
        const isChecked = statusRaw === 'checked';

        const rowStyle = isChecked
          ? 'background-color: #d4edda; color: #155724;'
          : 'background-color: #f8d7da; color: #721c24;';

        return `
          <tr style="${rowStyle}">
            <td style="border: 1px solid #999; padding: 6px;">${index + 1}</td>
            <td style="border: 1px solid #999; padding: 6px;">${this.escapeHtml(
              ticket.ticket_id ?? '—',
            )}</td>
            <td style="border: 1px solid #999; padding: 6px;">${this.escapeHtml(
              this.formatPdfTime(ticket.checkin_time),
            )}</td>
            <td style="border: 1px solid #999; padding: 6px;">${this.escapeHtml(
              ticket.qr_code ?? '—',
            )}</td>
            <td style="border: 1px solid #999; padding: 6px; font-weight: bold;">
              ${this.escapeHtml(ticket.ticket_status || 'Not Checked')}
            </td>
          </tr>`;
      })
      .join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align:center; color:#333;">${this.escapeHtml(title)}</h1>
        ${
          eventTimeLine
            ? `<p style="text-align:center; color:#555; margin-top: 6px; margin-bottom: 18px;">${eventTimeLine}</p>`
            : `<div style="height: 12px;"></div>`
        }

        <table style="width:100%; font-size:16px; margin-bottom:20px;">
          <tr><td><strong>Sold Tickets:</strong></td><td>${soldTickets}</td></tr>
          <tr><td><strong>Used Tickets:</strong></td><td>${usedTickets}</td></tr>
          <tr><td><strong>Remaining Tickets:</strong></td><td>${remainingTickets}</td></tr>
        </table>

        <h2 style="text-align:center; margin-bottom:10px;">Ticket Details</h2>
        <table style="width:100%; border-collapse: collapse; font-size:14px; margin-bottom:30px;">
          <tr style="background-color: #343a40; color: #fff;">
            <th style="border: 1px solid #999; padding: 6px;">#</th>
            <th style="border: 1px solid #999; padding: 6px;">Ticket ID</th>
            <th style="border: 1px solid #999; padding: 6px;">Checked-in Time</th>
            <th style="border: 1px solid #999; padding: 6px;">QR Code</th>
            <th style="border: 1px solid #999; padding: 6px;">Status</th>
          </tr>
          ${ticketRows}
        </table>

        <footer style="text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ccc; padding-top: 10px;">
          Generated by <strong>TicketWave</strong> &mdash; Simplifying Event Entry
        </footer>
      </div>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: `TicketStats_${Date.now()}`,
        directory: 'Documents', // better than "Download" for Android scoped storage
      };

      const file = await RNHTMLtoPDF.convert(options);

      this.setState({
        pdfFilePath: file.filePath,
        showPDFOptions: true,
      });

      return file.filePath;
    } catch (error) {
      console.error('PDF generation error:', error);
      this.showCustomAlert('Error', 'Failed to generate PDF.', 'error');
      return null;
    }
  };

  ensurePdfReady = async () => {
    if (this.state.pdfFilePath) return this.state.pdfFilePath;
    await this.generatePdf();
    return this.state.pdfFilePath;
  };

  downloadPdf = async () => {
    const path = await this.ensurePdfReady();
    if (!path) return this.showCustomAlert('Error', 'No PDF path.', 'error');

    this.setState({ showPDFOptions: false });
    this.showCustomAlert('Success', `PDF saved to:\n${path}`, 'success');
  };

  render() {
    const { title } = this.props.route.params;

    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        <GradientBackground>
          <SafeAreaView style={styles.safe}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.pageTitle}>Event Details</Text>

              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sold Tickets</Text>
                  <Text style={styles.detailValue}>{this.state.soldTickets}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Used Tickets</Text>
                  <Text style={styles.detailValue}>{this.state.usedTickets}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remaining Tickets</Text>
                  <Text style={styles.detailValue}>{this.state.remainingTickets}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From</Text>
                  <View style={styles.dateRow}>
                    <Text style={styles.detailValue}>{this.state.eventFrom}</Text>
                    <MaterialCommunityIcons
                      name="calendar-month"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.iconMargin}
                    />
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>To</Text>
                  <View style={styles.dateRow}>
                    <Text style={styles.detailValue}>{this.state.eventTo}</Text>
                    <MaterialCommunityIcons
                      name="calendar-month"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.iconMargin}
                    />
                  </View>
                </View>

                <View style={styles.pdfButtonWrap}>
                  <GradientButton
                    text={
                      <View style={styles.pdfContent}>
                        <MaterialCommunityIcons
                          name="file-pdf-box"
                          size={26}
                          color="#fff"
                          style={styles.iconMargin}
                        />
                        <Text style={styles.pdfText}>Generate PDF</Text>
                      </View>
                    }
                    onPress={this.generatePdf}
                  />
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>

          <BottomNavBar />

          <CustomAlert
            visible={this.state.showCustomAlert}
            title={this.state.alertTitle}
            message={this.state.alertMessage}
            onClose={this.hideCustomAlert}
            onConfirm={this.hideCustomAlert}
            showCancel={false}
            confirmText="OK"
          />

          {this.state.showPDFOptions && (
            <Modal
              visible={this.state.showPDFOptions}
              transparent
              animationType="fade"
              onRequestClose={() => this.setState({ showPDFOptions: false })}
            >
              <View style={styles.modalBackdrop}>
                {/* tap outside to close */}
                <Pressable
                  onPress={() => this.setState({ showPDFOptions: false })}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* centered glass panel */}
                <View style={styles.sheet}>
                  <View style={styles.sheetHandle} />

                  <Text style={styles.sheetTitle}>PDF Options</Text>
                  <Text style={styles.sheetSubtitle}>
                    View the report or save it to your device.
                  </Text>

                  <GradientButton
                    text={<Text style={styles.sheetBtnText}>View PDF</Text>}
                    onPress={async () => {
                      const path = await this.ensurePdfReady();
                      if (!path) {
                        return this.showCustomAlert('Error', 'No PDF path.', 'error');
                      }
                      this.setState({ showPDFOptions: false });
                      this.props.navigation.navigate('PdfViewer', { filePath: path });
                    }}
                    style={styles.sheetBtn}
                  />

                  <GradientButton
                    text={<Text style={styles.sheetBtnText}>Download PDF</Text>}
                    onPress={this.downloadPdf}
                    style={styles.sheetBtn}
                  />

                  <Pressable
                    onPress={() => this.setState({ showPDFOptions: false })}
                    style={styles.sheetCancel}
                  >
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          )}
        </GradientBackground>
      </>
    );
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: theme.spacing.headerTop + 4,
    paddingBottom: 140, // space for BottomNavBar
  },

  pageTitle: {
    fontSize: RFValue(18),
    color: theme.colors.text,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: theme.spacing.headerTop,
    marginBottom: 6,
  },

  title: {
    fontSize: RFValue(22),
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'left',
    marginTop: 8,
    marginBottom: 12,
  },

  detailsBox: {
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: theme.spacing.cardPadding,
    ...theme.shadow.card,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 14,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  detailLabel: {
    fontSize: RFValue(13),
    color: theme.colors.textMuted,
    fontWeight: '600',
  },

  detailValue: {
    fontSize: RFValue(13),
    color: theme.colors.text,
    fontWeight: '800',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconMargin: {
    marginLeft: 10,
  },

  pdfButtonWrap: {
    marginTop: 16,
  },

  pdfContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pdfText: {
    color: '#fff',
    fontSize: RFValue(15),
    fontWeight: '800',
    marginLeft: 10,
  },

  // overlay + centered panel
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)', // darker outside panel
    justifyContent: 'center',
    alignItems: 'center',
  },

  sheet: {
    width: '92%',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: theme.spacing.cardPadding,
    paddingTop: 18,
    paddingBottom: 18,
    ...theme.shadow.card,
  },

  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 16,
  },

  sheetTitle: {
    color: theme.colors.text,
    fontSize: RFValue(15),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },

  sheetSubtitle: {
    color: theme.colors.textMuted,
    fontSize: RFValue(11),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: RFValue(16),
    marginBottom: 14,
  },

  sheetBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12, // spacing between buttons
  },

  sheetBtnText: {
    color: '#fff',
    fontSize: RFValue(15),
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 14,
  },

  sheetCancel: {
    marginTop: 20,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetCancelText: {
    color: theme.colors.text,
    fontSize: RFValue(13),
    fontWeight: '800',
  },
});

export default ListTickets;
