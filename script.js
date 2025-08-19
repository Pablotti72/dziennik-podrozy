document.addEventListener("DOMContentLoaded", function () {
  const firebaseBaseUrl = "https://moj-dziennik-podrozy-default-rtdb.europe-west1.firebasedatabase.app";
  const tripsUrl = `${firebaseBaseUrl}/trips.json`;

  const map = L.map("map").setView([54.5, -3.0], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  // --- Ładowanie wypraw ---
  function loadTrips() {
    fetch(tripsUrl)
      .then(res => res.json())
      .then(trips => {
        map.eachLayer(layer => {
          if (layer instanceof L.Marker && !layer._isEditing) map.removeLayer(layer);
        });

        if (!trips) return;
        Object.keys(trips).forEach(key => {
          const trip = trips[key];
          const marker = L.marker([trip.lat, trip.lng], { title: trip.name }).addTo(map);
          marker._isEditing = true; // oznaczenie, że to nie formularz
          marker.bindPopup(`
            <strong><a href="trip.html?id=${key}">${trip.name}</a></strong><br>
            ${trip.description || ''}<br>
            <img src="${trip.image}" width="100"><br>
            <small>${formatDate(trip.dateFrom)} – ${formatDate(trip.dateTo)}</small><br><br>
            <button onclick="editTrip('${key}', ${trip.lat}, ${trip.lng})" style="background: #FFC107; border: none; padding: 6px 10px; border-radius: 4px; font-size: 14px;">✏️ Edytuj</button>
          `);
        });
      })
      .catch(err => console.error("Błąd ładowania wypraw:", err));
  }

  loadTrips();

  // --- Obsługa kliknięcia na mapie (dodaj wyprawę) ---
  map.on("click", function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    openAddTripModal(lat, lng);
  });

  // --- Formularz wyprawy ---
  window.openAddTripModal = function(lat, lng) {
    document.getElementById("tripForm").reset();
    document.getElementById("tripLat").value = lat;
    document.getElementById("tripLng").value = lng;
    document.getElementById("tripModalTitle").textContent = "Dodaj nową wyprawę";
    document.getElementById("saveTripBtn").textContent = "Zapisz";
    document.getElementById("tripId").value = "";
    document.getElementById("tripModal").style.display = "flex";
  };

  window.editTrip = function(id, lat, lng) {
    fetch(`${firebaseBaseUrl}/trips/${id}.json`)
      .then(res => res.json())
      .then(trip => {
        document.getElementById("tripName").value = trip.name;
        document.getElementById("tripDescription").value = trip.description || '';
        document.getElementById("tripImage").value = trip.image;
        document.getElementById("tripDateFrom").value = trip.dateFrom || '';
        document.getElementById("tripDateTo").value = trip.dateTo || '';
        document.getElementById("tripLat").value = lat;
        document.getElementById("tripLng").value = lng;
        document.getElementById("tripId").value = id;

        document.getElementById("tripModalTitle").textContent = "Edytuj wyprawę";
        document.getElementById("saveTripBtn").textContent = "Zaktualizuj";
        document.getElementById("tripModal").style.display = "flex";
      });
  };

  document.getElementById("tripForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const id = document.getElementById("tripId").value;
    const isEdit = id !== "";

    const tripData = {
      name: document.getElementById("tripName").value,
      description: document.getElementById("tripDescription").value,
      image: document.getElementById("tripImage").value,
      dateFrom: document.getElementById("tripDateFrom").value,
      dateTo: document.getElementById("tripDateTo").value,
      lat: parseFloat(document.getElementById("tripLat").value),
      lng: parseFloat(document.getElementById("tripLng").value),
      places: {}
    };

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit 
      ? `${firebaseBaseUrl}/trips/${id}.json` 
      : `${firebaseBaseUrl}/trips.json`;

    fetch(url, {
      method: method,
      body: JSON.stringify(tripData),
      headers: { "Content-Type": "application/json" }
    })
    .then(() => {
      closeTripModal();
      showMessage("✅ Wyprawa zapisana!");
      loadTrips(); // odśwież mapę
    })
    .catch(err => {
      console.error("Błąd zapisu:", err);
      showMessage("Nie udało się zapisać wyprawy.");
    });
  });

  window.closeTripModal = function() {
    document.getElementById("tripModal").style.display = "none";
  };

  // --- Komunikaty ---
  window.showMessage = function(text) {
    const modal = document.getElementById("msgModal");
    const msgText = document.getElementById("msgText");
    msgText.textContent = text;
    modal.style.display = "flex";
  };

  window.closeMsgModal = function() {
    document.getElementById("msgModal").style.display = "none";
  };

  // --- Format daty ---
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  }
});
