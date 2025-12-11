const axios = require("axios");

const N = 20; // concurrent clients
const requests = [];

for (let i = 0; i < N; i++) {
  requests.push(
    axios.post("http://localhost:4000/book", {
      showId: 1,
      seats: [1],            // all trying to book seat 1
      userName: "tester" + i
    }).then(r => ({ i, status: "ok", data: r.data }))
      .catch(e => ({ i, status: "error", data: e.response?.data || e.message }))
  );
}

Promise.all(requests).then(results => {
  console.log(results);
}).catch(err => console.error(err));
