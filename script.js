let places = [];

const firebaseBaseUrl = "https://moj-dziennik-podrozy-default-rtdb.europe-west1.firebasedatabase.app";
const firebasePlacesUrl = `${firebaseBaseUrl}/places.json`;

document.addEventListener("DOMContentLoaded", function () {
  const map = L.map("map").setView([54.5, -3.0], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  fetch(firebasePlacesUrl)
    .then(res => res.json().catch(() => null))
    .then(data => {
      places = [];
      if (data) {
        places = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
      addMarkersToMap(places, map);
    });

  function addMarkersToMap(data, map) {
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    data.forEach(place => {
      const marker = L.marker([place.lat, place.lng]).addTo(map);
      marker.bindTooltip(place.name, { direction: "top" });
      marker.bindPopup(`
        <strong><a href="place.html?id=${place.id}">${place.name}</a></strong><br>
        ${place.description}<br>
        <img src="${place.image}" width="100"><br>
        <small>${place.category}</small><br><br>
        <button onclick="editPlace('${place.id}')" style="background: #FFC107; border: none; padding: 6px 10px; border-radius: 4px;">✏️ Edytuj</button>
        <button onclick="deletePlace('${place.id}')" style="background: #F44336; color: white; border: none; padding: 6px 10px; border-radius: 4px; margin-left: 5px;">🗑️ Usuń</button>
      `);
    });
  }

  map.on("click", function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    if (confirm(`Dodaj nowe miejsce w: ${lat.toFixed(4)}, ${lng.toFixed(4)}?`)) {
      openAddModal(lat, lng);
    }
  });

  window.openAddModal = function(lat, lng) {
    document.getElementById("placeForm").reset();
    document.getElementById("photos-container").innerHTML = `
      <div class="photo-item">
        <label>Zdjęcie URL: <input type="url" class="photo-url" placeholder="https://..."></label><br>
        <label>Komentarz: <input type="text" class="photo-caption" placeholder="Opis zdjęcia"></label><br><br>
      </div>
    `;
    document.getElementById("placeLat").value = lat;
    document.getElementById("placeLng").value = lng;
    document.getElementById("placeId").value = "";
    document.getElementById("modalTitle").textContent = "Dodaj nowe miejsce";
    document.getElementById("saveBtn").textContent = "Zapisz";
    document.getElementById("modal").style.display = "flex";
  };

  window.editPlace = function(id) {
    const place = places.find(p => p.id === id);
    if (!place) return;

    document.getElementById("placeName").value = place.name;
    document.getElementById("placeDescription").value = place.description;
    document.getElementById("placeImage").value = place.image;
    document.getElementById("placeCategory").value = place.category;
    document.getElementById("placeDateFrom").value = place.dateFrom || "";
    document.getElementById("placeDateTo").value = place.dateTo || "";
    document.getElementById("placeLat").value = place.lat;
    document.getElementById("placeLng").value = place.lng;
    document.getElementById("placeId").value = id;

    const container = document.getElementById("photos-container");
    container.innerHTML = "";
    if (place.photos && place.photos.length > 0) {
      place.photos.forEach(photo => {
        const item = document.createElement("div");
        item.className = "photo-item";
        item.innerHTML = `
          <label>Zdjęcie URL: <input type="url" class="photo-url" value="${photo.url}" placeholder="https://..."></label><br>
          <label>Komentarz: <input type="text" class="photo-caption" value="${photo.caption || ''}" placeholder="Opis zdjęcia"></label><br><br>
        `;
        container.appendChild(item);
      });
    } else {
      container.innerHTML = `
        <div class="photo-item">
          <label>Zdjęcie URL: <input type="url" class="photo-url" placeholder="https://..."></label><br>
          <label>Komentarz: <input type="text" class="photo-caption" placeholder="Opis zdjęcia"></label><br><br>
        </div>
      `;
    }

    document.getElementById("modalTitle").textContent = "Edytuj miejsce";
    document.getElementById("saveBtn").textContent = "Zaktualizuj";
    document.getElementById("modal").style.display = "flex";
  };

  window.deletePlace = function(id) {
    if (confirm("Usunąć miejsce?")) {
      fetch(`${firebaseBaseUrl}/places/${id}.json`, { method: "DELETE" })
        .then(() => {
          places = places.filter(p => p.id !== id);
          addMarkersToMap(places, map);
          showMessage("✅ Usunięte!");
        });
    }
  };

  window.closeModal = function() {
    document.getElementById("modal").style.display = "none";
  };

  window.addPhotoField = function() {
    const container = document.getElementById("photos-container");
    const item = document.createElement("div");
    item.className = "photo-item";
    item.innerHTML = `
      <label>Zdjęcie URL: <input type="url" class="photo-url" placeholder="https://..."></label><br>
      <label>Komentarz: <input type="text" class="photo-caption" placeholder="Opis zdjęcia"></label><br><br>
    `;
    container.appendChild(item);
  };

  document.getElementById("placeForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const id = document.getElementById("placeId").value;
    const isEdit = id !== "";

    const photos = [];
    document.querySelectorAll(".photo-url").forEach((input, i) => {
      if (input.value.trim() !== "") {
        photos.push({
          url: input.value.trim(),
          caption: document.querySelectorAll(".photo-caption")[i]?.value.trim() || ""
        });
      }
    });

    const placeData = {
      name: document.getElementById("placeName").value,
      lat: parseFloat(document.getElementById("placeLat").value),
      lng: parseFloat(document.getElementById("placeLng").value),
      description: document.getElementById("placeDescription").value,
      image: document.getElementById("placeImage").value,
      category: document.getElementById("placeCategory").value,
      dateFrom: document.getElementById("placeDateFrom").value,
      dateTo: document.getElementById("placeDateTo").value,
      photos: photos
    };

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit 
      ? `${firebaseBaseUrl}/places/${id}.json` 
      : `${firebaseBaseUrl}/places.json`;

    fetch(url, {
      method: method,
      body: JSON.stringify(placeData),
      headers: { "Content-Type": "application/json" }
    })
    .then(() => {
      if (!isEdit) {
        placeData.id = Date.now().toString();
        places.push(placeData);
      } else {
        const index = places.findIndex(p => p.id === id);
        if (index !== -1) places[index] = { ...placeData, id };
      }
      addMarkersToMap(places, map);
      closeModal();
      showMessage(isEdit ? "✅ Zaktualizowano!" : "✅ Dodano!");
    });
  });

  window.showMessage = function(text) {
    const msgText = document.getElementById("msgText");
    msgText.textContent = text;
    document.getElementById("msgModal").style.display = "flex";
  };

  window.closeMsgModal = function() {
    document.getElementById("msgModal").style.display = "none";
  };
});
