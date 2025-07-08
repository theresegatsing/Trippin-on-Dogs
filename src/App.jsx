import { useState } from 'react';
import './App.css';

const API_KEY = 'live_MEn3L9E4hg7qa5TMTTLvroujvSFwTagUsicnp0ErYiqWFR7tyMzzZ5xMxT3se7SE';
const API_URL = 'https://api.thedogapi.com/v1/images/search';
const MAX_HISTORY = 50;
const MAX_ATTEMPTS = 15; // Increased attempts to find non-banned dogs

function App() {
  const [currentDog, setCurrentDog] = useState(null);
  const [banList, setBanList] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if any of the dog's attributes are banned
  
  const isDogBanned = (dogData) => {
    return banList.some(banItem => {
      const value = banItem.value.toLowerCase();

      // Check breed (exact match or partial)
      if (banItem.type === 'breed' && dogData.breed.toLowerCase().includes(value)) {
        return true;
      }

      // Check temperament (if the banned word is in the temperament string)
      if (banItem.type === 'temperament' &&
          dogData.temperament &&
          dogData.temperament.toLowerCase().includes(value)) {
        return true;
      }

      // Check life_span (must match part of it)
      if (banItem.type === 'life_span' &&
          dogData.life_span &&
          dogData.life_span.toLowerCase().includes(value)) {
        return true;
      }

      return false;
    });
  };


  const fetchRandomDog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let validDogFound = false;
      let attempts = 0;
      
      while (!validDogFound && attempts < MAX_ATTEMPTS) {
        attempts++;
        const response = await fetch(`${API_URL}?has_breeds=true&size=med`, {
          headers: { 'x-api-key': API_KEY }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        
        if (data[0]?.breeds?.length > 0) {
          const breedInfo = data[0].breeds[0];
          
          if (breedInfo.name) {
            const dogData = {
              image: data[0].url,
              breed: breedInfo.name,
              temperament: breedInfo.temperament || 'Temperament unknown',
              life_span: breedInfo.life_span || 'Lifespan unknown'
            };

            // Skip if any attribute is banned
            if (!isDogBanned(dogData)) {
              setCurrentDog(dogData);
              setHistory(prev => [dogData, ...prev.slice(0, MAX_HISTORY - 1)]);
              validDogFound = true;
            }
          }
        }
      }

      if (!validDogFound) {
        setError('No dogs found matching your criteria. Try adjusting your ban list.');
      }
    } catch (err) {
      setError(`Failed to fetch dog: ${err.message}`);
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttributeClick = (type, value) => {
    if (!value || value.includes('unknown')) return;

    const isAlreadyBanned = banList.some(
      item => item.type === type && item.value.toLowerCase() === value.toLowerCase()
    );

    // 🔁 If already banned, toggle it off
    if (isAlreadyBanned) {
      setBanList(prev =>
        prev.filter(item => !(item.type === type && item.value.toLowerCase() === value.toLowerCase()))
      );
      return;
    }

    // 🆕 Only process multi-word temperament when banning for the first time
    if (type === 'temperament') {
      const words = value.split(/,|\s+/).filter(w => w.length > 0);
      setBanList(prev => [
        ...prev,
        ...words
          .filter(word => !prev.some(item => item.type === type && item.value.toLowerCase() === word.toLowerCase()))
          .map(word => ({ type, value: word }))
      ]);
      return;
    }

    // Default ban toggle for breed/life_span
    setBanList(prev =>
      [...prev, { type, value }]
    );
  };

  const getAttributeClassName = (type, value) => {
    if (!value || value.includes('unknown')) return 'attribute';
    
    // Special handling for temperament words
    if (type === 'temperament') {
      const words = value.split(/,|\s+/);
      const isBanned = words.some(word => 
        banList.some(item => item.type === type && item.value.toLowerCase() === word.toLowerCase())
      );
      return `attribute ${isBanned ? 'banned' : ''}`;
    }
    
    const isBanned = banList.some(item => 
      item.type === type && item.value === value
    );
    return `attribute ${isBanned ? 'banned' : ''}`;
  };

  return (
    <div className="app">
      <header>
        <h1>Trippin' on Dogs</h1>
        <p>Discover dogs from your wildest dreams!</p>
        <div className="dog-emoji">🐶🐕🦮🐩🐕‍🦺🐾</div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="main-content">
        <div className="left-column fixed-section">
          <div className="history-section">
            <h3>Who have we seen so far?</h3>
            <div className="history-items">
              {history.length === 0 ? (
                <p className="empty-history">No dogs discovered yet</p>
              ) : (
                history.map((dog, index) => (
                  <div key={index} className="history-item">
                    <img src={dog.image} alt={dog.breed} />
                    <p>{dog.breed}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="center-column">
          <div className="current-dog fixed-section">
            {currentDog && (
              <>
                <h2>{currentDog.breed}</h2>
                <div className="image-container">
                  <img src={currentDog.image} alt={currentDog.breed} />
                </div>
                <div className="attributes-container">
                  <p className={getAttributeClassName('breed', currentDog.breed)} 
                     onClick={() => handleAttributeClick('breed', currentDog.breed)}>
                    <strong>Breed:</strong> {currentDog.breed}
                  </p>
                  <p className={getAttributeClassName('temperament', currentDog.temperament)}
                     onClick={() => handleAttributeClick('temperament', currentDog.temperament)}>
                    <strong>Temperament:</strong> {currentDog.temperament}
                  </p>
                  <p className={getAttributeClassName('life_span', currentDog.life_span)}
                     onClick={() => handleAttributeClick('life_span', currentDog.life_span)}>
                    <strong>Lifespan:</strong> {currentDog.life_span}
                  </p>
                </div>
              </>
            )}
          </div>
          <button onClick={fetchRandomDog} disabled={isLoading} className="discover-button">
            {isLoading ? 'Loading...' : '🔀 Discover!'}
          </button>
        </div>

        <div className="right-column fixed-section">
          <div className="ban-list">
            <h3>Ban List</h3>
            <p>Click attributes to ban/unban</p>
            {banList.length === 0 ? (
              <p className="empty-ban">No banned attributes</p>
            ) : (
              <ul>
                {banList.map((item, index) => (
                  <li key={index} onClick={() => handleAttributeClick(item.type, item.value)}>
                    {item.value} <span>({item.type})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;