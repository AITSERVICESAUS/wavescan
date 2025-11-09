const TicketDetail = (qrcode) => (
  fetch('https://ticketwave.com.au/wp-json/meup/v1/ticket_detail/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      qrcode: qrcode,
    }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.status === 'SUCCESS' && json.ticket) {
        return json.ticket;
      } else {
        throw new Error('Invalid response or no ticket data');
      }
    })
    .catch((error) => {
      console.error('Error in TicketDetail API:', error);
      return null;
    })
);

module.exports = TicketDetail;
