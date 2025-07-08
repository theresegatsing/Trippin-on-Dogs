import { useState, useEffect } from 'react';
import './App.css';

const API_KEY = 'live_MEn3L9E4hg7qa5TMTTLvroujvSFwTagUsicnp0ErYiqWFR7tyMzzZ5xMxT3se7SE';
const API_URL = 'https://api.thedogapi.com/v1/images/search';
const MAX_HISTORY = 50; // Store more dogs to reduce repeats

function App() {
  const [currentDog, setCurrentDog] = useState(null);
  const [banList, setBanList] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seenBreeds, setSeenBreeds] = useState(new Set());

  const fetchRandomDog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let validDogFound = false;
      let attempts = 0;
      const maxAttempts = 10; // Increased attempts to find unique dog
      
      while (!validDogFound && attempts < maxAttempts) {
        attempts++;
        const response = await fetch(`${API_URL}?has_breeds=true&size=med`, {
          headers: { 'x-api-key': API_KEY }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        
        if (data[0]?.breeds?.length > 0) {
          const breedInfo = data[0].breeds[0];
          
          if (breedInfo.name && !seenBreeds.has(breedInfo.name)) {
            const dogData = {
              image: data[0].url,
              breed: breedInfo.name,
              temperament: breedInfo.temperament || 'Temperament unknown',
              life_span: breedInfo.life_span || 'Lifespan unknown',
              bred_for: breedInfo.bred_for || 'Purpose unknown',
              origin: breedInfo.origin || 'Origin unknown'
            };

            const isBanned = banList.some(item => 
              item.type === 'breed' && item.value === dogData.breed
            );

            if (!isBanned) {
              setCurrentDog(dogData);
              setHistory(prev => [dogData, ...prev.slice(0, MAX_HISTORY - 1)]);
              setSeenBreeds(prev => new Set(prev).add(dogData.breed));
              validDogFound = true;
            }
          }
        }
      }

      if (!validDogFound) {
        // If we can't find new breed, allow repeats but show message
        setError('Showing repeat dog - we\'re having trouble finding new breeds!');
        fetchRandomDog(); // Try again without breed uniqueness check
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
    setBanList(prev => 
      prev.some(item => item.type === type && item.value === value)
        ? prev.filter(item => !(item.type === type && item.value === value))
        : [...prev, { type, value }]
    );
  };

  const getAttributeClassName = (type, value) => {
    return `attribute ${banList.some(item => item.type === type && item.value === value) ? 'banned' : ''}`;
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
                  <p className={getAttributeClassName('origin', currentDog.origin)}
                     onClick={() => handleAttributeClick('origin', currentDog.origin)}>
                    <strong>Origin:</strong> {currentDog.origin}
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