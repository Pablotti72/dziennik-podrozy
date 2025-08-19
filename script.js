document.addEventListener("DOMContentLoaded", function () {
  const firebaseBaseUrl = "https://moj-dziennik-podrozy-default-rtdb.europe-west1.firebasedatabase.app";
  const tripsUrl = `${firebaseBaseUrl}/trips.json`;

  const map = L.map("map").setView([54.5, -3.0], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  // Tryb dodawania wyprawy
  let isAddingTrip = false;

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
          marker._isEditing = true;
          marker.bindPopup(`
            <strong><a href="trip.html?id=${key}">${trip.name}</a></strong><br>
            ${trip.description || ''}<br>
            <img src="${trip.image}" width="100"><br>
            <small>${formatDate(trip.dateFrom)} – ${formatDate(trip.dateTo)}</small><br><br>
            <button onclick="editTrip('${key}', ${trip.lat}, ${trip.lng})" style="background: #FFC107; border: none; padding: 6px 10px; border-radius: 4px; font-size: 14px;">✏️ Edytuj</button>
            <button onclick="deleteTrip('${key}')" style="background: #F44336; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-left: 5px;">🗑️ Usuń</button>
          `);
        });
      })
      .catch(err => console.error("Błąd ładowania wypraw:", err));
  }

  loadTrips();

  // --- Tryb dodawania wyprawy ---
  document.getElementById("addTripBtn").addEventListener("click", function () {
    if (isAddingTrip) {
      isAddingTrip = false;
      this.textContent = "➕ Dodaj wyprawę";
      this.style.background = "#4CAF50";
      showMessage("Tryb dodawania wyłączony");
    } else {
      isAddingTrip = true;
      this.textContent = "🛑 Anuluj";
      this.style.background = "#f44336";
      showMessage("Kliknij na mapie, gdzie dodać wyprawę");
    }
  });

  // Kliknięcie na mapie
  map.on("click", function (e) {
    if (isAddingTrip) {
      isAddingTrip = false;
      document.getElementById("addTripBtn").textContent = "➕ Dodaj wyprawę";
      document.getElementById("addTripBtn").style.background = "#4CAF50";
      openAddTripModal(e.latlng.lat, e.latlng.lng);
    }
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
      loadTrips();
    })
    .catch(err => {
      console.error("Błąd zapisu:", err);
      showMessage("Nie udało się zapisać wyprawy.");
    });
  });

  window.closeTripModal = function() {
    document.getElementById("tripModal").style.display = "none";
  };

  window.deleteTrip = function(tripId) {
    if (confirm("Czy na pewno chcesz usunąć tę wyprawę?")) {
      fetch(`${firebaseBaseUrl}/trips/${tripId}.json`, { method: "DELETE" })
        .then(() => {
          showMessage("✅ Wyprawa usunięta!");
          loadTrips();
        })
        .catch(err => {
          console.error("Błąd usuwania:", err);
          showMessage("Nie udało się usunąć wyprawy.");
        });
    }
  };

  window.showMessage = function(text) {
    const modal = document.getElementById("msgModal");
    const msgText = document.getElementById("msgText");
    msgText.textContent = text;
    modal.style.display = "flex";
  };

  window.closeMsgModal = function() {
    document.getElementById("msgModal").style.display = "none";
  };

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  }
});
