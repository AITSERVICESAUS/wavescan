fetch(token[0]+'wp-json/meup/v1/check_login/',
{
    method: 'POST',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        
    },
    body: JSON.stringify({ 
        token: token[1],
    })
})
.then( res => res.json() )