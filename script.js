document.addEventListener("DOMContentLoaded", function () {
  const firebaseBaseUrl = "https://moj-dziennik-podrozy-default-rtdb.europe-west1.firebasedatabase.app";
  const tripsUrl = `${firebaseBaseUrl}/trips.json`;

  const map = L.map("map").setView([54.5, -3.0], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  fetch(tripsUrl)
    .then(res => res.json())
    .then(trips => {
      if (!trips) return;
      Object.keys(trips).forEach(key => {
        const trip = trips[key];
        const marker = L.marker([trip.lat, trip.lng]).addTo(map);
        marker.bindPopup(`
          <strong><a href="trip.html?id=${key}" style="color: inherit;">${trip.name}</a></strong><br>
          ${trip.description}<br>
          <img src="${trip.image}" width="100"><br>
          <small>${formatDate(trip.dateFrom)} – ${formatDate(trip.dateTo)}</small>
        `);
      });
    })
    .catch(err => console.error("Błąd ładowania wypraw:", err));

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  }

  window.showMessage = function(text) {
    const modal = document.getElementById("msgModal");
    const msgText = document.getElementById("msgText");
    msgText.textContent = text;
    modal.style.display = "flex";
  };

  window.closeMsgModal = function() {
    document.getElementById("msgModal").style.display = "none";
  };
});
