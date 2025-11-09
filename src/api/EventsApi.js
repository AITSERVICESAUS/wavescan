const EventsApi = (token) => (
    fetch(token[0] + 'wp-json/meup/v1/event_accepted/',
    {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: token[1],
        }),
    })
    .then( res => res.json() )
);


module.exports = EventsApi;
