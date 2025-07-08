
import { useState, useEffect } from 'react';
import './App.css';

// API configuration
const API_KEY = 'live_MEn3L9E4hg7qa5TMTTLvroujvSFwTagUsicnp0ErYiqWFR7tyMzzZ5xMxT3se7SE';
const API_URL = 'https://api.thedogapi.com/v1/images/search';

function App() {
  const [currentDog, setCurrentDog] = useState(null);
  const [banList, setBanList] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRandomDog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let validDogFound = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!validDogFound && attempts < maxAttempts) {
        attempts++;
        const response = await fetch(`${API_URL}?has_breeds=true&size=med`, {
          headers: {
            'x-api-key': API_KEY
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data[0]?.breeds?.length > 0) {
          const breedInfo = data[0].breeds[0];
          
          if (breedInfo.name) {
            const dogData = {
              image: data[0].url,
              breed: breedInfo.name,
              temperament: breedInfo.temperament || 'Temperament unknown',
              life_span: breedInfo.life_span || 'Lifespan unknown',
              bred_for: breedInfo.bred_for || 'Purpose unknown',
              origin: breedInfo.origin || 'Origin unknown'
            };

            // Check if banned
            const isBanned = banList.some(item => 
              item.type === 'breed' && item.value === dogData.breed
            );

            if (!isBanned) {
              setCurrentDog(dogData);
              setHistory(prev => [dogData, ...prev.slice(0, 9)]); // Keep only last 10
              validDogFound = true;
            }
          }
        }
      }

      if (!validDogFound) {
        setError('Could not find a suitable dog. Try again or check your ban list.');
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
    
    const isInBanList = banList.some(item => item.type === type && item.value === value);
    
    if (isInBanList) {
      setBanList(banList.filter(item => !(item.type === type && item.value === value)));
    } else {
      setBanList([...banList, { type, value }]);
    }
  };

  const getAttributeClassName = (type, value) => {
    const baseClass = 'attribute';
    const isBanned = banList.some(item => item.type === type && item.value === value);
    return isBanned ? `${baseClass} banned` : baseClass;
  };

  useEffect(() => {
    fetchRandomDog();
  }, []);

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
            {currentDog ? (
              <>
                <h2>{currentDog.breed}</h2>
                <img src={currentDog.image} alt={currentDog.breed} />
                <div className="attributes">
                  <p className={getAttributeClassName('breed', currentDog.breed)} 
                     onClick={() => handleAttributeClick('breed', currentDog.breed)}>
                    Breed: {currentDog.breed}
                  </p>
                  <p className={getAttributeClassName('temperament', currentDog.temperament)}
                     onClick={() => handleAttributeClick('temperament', currentDog.temperament)}>
                    Temperament: {currentDog.temperament}
                  </p>
                  <p className={getAttributeClassName('life_span', currentDog.life_span)}
                     onClick={() => handleAttributeClick('life_span', currentDog.life_span)}>
                    Lifespan: {currentDog.life_span}
                  </p>
                  <p className={getAttributeClassName('origin', currentDog.origin)}
                     onClick={() => handleAttributeClick('origin', currentDog.origin)}>
                    Origin: {currentDog.origin}
                  </p>
                </div>
              </>
            ) : (
              <p>{isLoading ? 'Finding your perfect pup...' : 'No dogs available right now'}</p>
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