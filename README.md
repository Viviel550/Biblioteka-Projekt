# Biblioteka-Projekt

Projekt biblioteki w ramach kursu "Projektowanie usług internetowych"

## Funkcje
- Pobieranie książek z API https://wolnelektury.pl/api/
- Możliwość dodawania dostępnych książek do ulubionych
- Możliwość rejestracji i logowania
- Zarządzaniem książkami udostępnionymi dla biblioteki

### Wymagania
- Python 3.12 or higher
- Nodejs v22.14.0 i npm  

## Instalacja
1. Skopiuj repozytorium
```bash
git clone https://github.com/Viviel550/Biblioteka-Projekt.git
cd Biblioteka-Projekt
```
2. Ustaw Front-End (React)
```
cd client 
npm install 
npm start
```
3. Ustaw Back-End (Python/Flask)
```
cd flask-server
python -m venv {nazwa_środowiska}
```
W zależności od wersji Pythona
```
./{nazwa_środowiska}/Scripts/activate
```
Lub

```
source ./{nazwa_środowiska}/bin/activate
```

Następnie zainstaluj wymagane pakiety i uruchom serwer:
```
pip install -r requirements.txt
python server.py
```