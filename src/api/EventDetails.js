const EventDetails = (url, event_id) =>
  fetch(url + 'wp-json/meup/v1/event_detail/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_id: event_id.toString(),
    }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json && json.status === 'SUCCESS' && json.event) {
        const calendar = json.event.event_calendar || '';

        if (calendar.includes(' - ')) {
          const [from, to] = calendar.split(' - ');
          return {
            from: from.trim(),
            to: to.trim(),
          };
        }
      }
      throw new Error('Invalid response from event_detail');
    })
    .catch((error) => {
      console.error('Error in EventDetails:', error);
      return { from: '', to: '' };
    });

module.exports = EventDetails;
