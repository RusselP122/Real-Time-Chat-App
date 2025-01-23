import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Landing.module.css'; // Import CSS Module

const Landing = () => {
    return (
        <div className={styles.landingContainer}>
            <div className={styles.textContent}>
                <header>
                    <nav>

                    </nav>
                </header>
                <main>
                    <h2>Live Chat</h2>
                    <p>Collaborate instantly, communicate seamlessly. Get started today!</p>
                    <div className={styles.buttons}>
                        <Link to="/login">
                            <button>Login</button>
                        </Link>
                        <Link to="/createAccount">
                            <button>Sign Up</button>
                        </Link>
                    </div>
                </main>
                <footer> © 2024 | 3WMAD3 | All rights reserved</footer>
            </div>
            <div className={styles.imageContainer}>
                <img src="/ccc.png" alt="Chat app preview" />
            </div>
        </div>
    );
};

export default Landing;
