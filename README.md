# Client-Side JS SDK for Splinterlands

### CDN URLs

```
<script src="https://cdn.jsdelivr.net/gh/steem-monsters/splinterlands-js@master/dist/splinterlands.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/steem-monsters/splinterlands-js@master/dist/splinterlands.min.css" />
```

### Init

Initializes the SDK with the API server URL and WebSocket server URL.

```
// Production URLs
await splinterlands.init({ api_url: 'https://steemmonsters.com', ws_url: 'wss://ws.steemmonsters.io' });

// QA Site URLs
await splinterlands.init({ api_url: 'https://testnet.steemmonsters.io', ws_url: 'wss://sm-ws.mrosen.com' });
```

### Login

Log in to the game using a Steem blockchain account.

If no parameters are specified, it will attempt to log in using the login information stored in the browser's local storage. The `has_saved_login()` method can be used to check whether or not the user has credentials stored locally in the browser.

```
if(splinterlands.has_saved_login()) {
	// Attempt to log in using saved credentials
	let login_response = await splinterlands.login();

	if(!login_response.error) {
		// If there is no error, the user was successfully logged in and you can proceed to show the home screen
		// The "login_response" variable will contain the player information returned by the server
	} else {
		// If there was an error, just show the log in screen
	}
}
```

If only a username is specified, it will attempt to log in using the Steem Keychain browser extension which securely stores the Steem account passwords. Finally, if both a username and a password are specified, it will use that information to attempt to log in.

```
// Attempt to log in using saved credentials
let login_response = await splinterlands.login(username, password (optional));

if(login_response.error) {
	// Display the error message to the user
} else {
	// Proceed to show the home screen. The "login_response" variable will contain the player information returned by the server
}
```
