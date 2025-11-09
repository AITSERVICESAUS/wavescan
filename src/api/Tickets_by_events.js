
const Tickets_by_events = (token, eid) => (
  fetch(token[0] + 'wp-json/meup/v1/tickets_by_events/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eid: eid,
      token: token[1],
    }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.status === 'SUCCESS' && json.events.length > 0) {
        return json.events[0];
      } else {
        throw new Error('Invalid response or no event data');
      }
    })
    .catch((error) => {
      console.error('Error in TicketsApi:', error);
      return null;
    })
);

module.exports = Tickets_by_events;
