import axios from 'axios';

async function checkApi() {
    try {
        console.log("Testing API Connection...");
        const res = await axios.get('http://localhost:5000/api/spotify/new-releases');
        console.log("Status:", res.status);
        console.log("Data Type:", typeof res.data);

        if (res.data && res.data.albums && Array.isArray(res.data.albums.items)) {
            console.log("Structure Valid: albums.items found.");
            console.log("Item Count:", res.data.albums.items.length);
            console.log("First Item:", res.data.albums.items[0].name);
        } else {
            console.log("Structure Invalid:", JSON.stringify(res.data).substring(0, 200));
        }

    } catch (err) {
        console.error("API Fetch Failed:", err.message);
        if (err.response) {
            console.error("Response Data:", err.response.data);
        }
    }
}

checkApi();
