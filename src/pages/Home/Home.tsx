import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[var(--primary-color)] text-[var(--primary-text-color)]">
      <div className="flex flex-col border-6 border-[var(--border-color)] p-4 items-center gap-2">
        <h1 className={styles.eyeTitle}>Hello, Adventurer</h1>
        <h2 className={styles.eyeWelcome}>Start Your Journey Now</h2>
        <div className={styles.downArrow} aria-hidden="true">
          ▼
        </div>
      </div>

      {/* Select Player Type */}
      <div className={styles.playerGrid}>
        <button
          key="new-player"
          className={styles.playerWidget}
          onClick={() => navigate('/chat')}
        >
          I'm a new Player
        </button>

        <button
          key="new-gm"
          className={styles.playerWidget}
          onClick={() => alert(`We go here!`)}
        >
          I'm a new Game Master
        </button>

        <button
          key="master-rules"
          className={styles.playerWidget}
          onClick={() => alert(`Waiting for future dev...`)}
        >
          Guide me through all rules
        </button>

        <button
          key="assisstant"
          className={styles.playerWidget}
          onClick={() => alert(`Waiting for future dev...`)}
        >
          I need AI assisstant
        </button>
      </div>
    </div>
  );
};

export default Home;