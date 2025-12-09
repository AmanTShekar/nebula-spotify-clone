import axios from 'axios';
import querystring from 'querystring';

let spotifyToken = null;
let tokenExpirationTime = 0;

export const getSpotifyToken = async () => {
    const currentTime = Date.now();

    if (spotifyToken && currentTime < tokenExpirationTime) {
        return spotifyToken;
    }

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            querystring.stringify({ grant_type: 'client_credentials' }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization:
                        'Basic ' +
                        Buffer.from(
                            (process.env.SPOTIFY_CLIENT_ID?.trim() || '') + ':' + (process.env.SPOTIFY_CLIENT_SECRET?.trim() || '')
                        ).toString('base64'),
                },
            }
        );

        spotifyToken = response.data.access_token;
        // Set expiration time (subtract 60s buffer)
        tokenExpirationTime = currentTime + response.data.expires_in * 1000 - 60000;

        return spotifyToken;
    } catch (error) {
        console.error('Error fetching Spotify token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Spotify');
    }
};
