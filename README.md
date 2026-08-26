GaPa Blog – wersja z nową stroną główną

Pliki:
- index.html – nowa strona główna GaPa Blog
- map.html – dotychczasowa mapa (przeniesiona z index.html)
- list.html – galeria 3-etapowa
- trip.html – strona wyprawy
- place.html – strona miejsca
- home.css – styl strony głównej
- style.css / gallery.css – istniejące style mapy, wypraw, miejsc i galerii

Panel administracyjny strony głównej:
- dostępny tylko po zalogowaniu użytkownika posiadającego admins/{uid}=true w Firebase Realtime Database;
- pozwala zmienić zdjęcie tła, zdjęcie O Nas oraz tekst O Nas;
- zmiany tekstu i adresów zdjęć są zapisywane w siteContent/home.

Zdjęcia:
- można wkleić URL zdjęcia bezpośrednio w panelu;
- panel zawiera też wybór pliku przez Firebase Storage. Jeśli Storage Rules blokują zapis, użyj URL albo skonfiguruj bezpieczne reguły Storage.

Po wgraniu na GitHub:
1. Podmień/dodaj wszystkie pliki z tego katalogu.
2. Upewnij się, że index.html jest nową stroną główną, a map.html jest starą stroną mapy.
3. Zrób Ctrl+F5.
