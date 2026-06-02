import React, { Component } from 'react'

export class Header extends Component {
  render() {
    return (
          <nav>
        <div className="wrap nav-in">
            <a href="#" className="logo">
                <span className="logo-mark"><svg viewBox="0 0 23 23" fill="none">
                        <circle cx="11.5" cy="4.2" r="2.4" fill="#04121a" />
                        <line x1="11.5" y1="6.6" x2="11.5" y2="13.5" stroke="#04121a" stroke-width="2.1"
                            stroke-linecap="round" />
                        <line x1="11.5" y1="9" x2="6" y2="12.5" stroke="#04121a" stroke-width="2.1"
                            stroke-linecap="round" />
                        <line x1="11.5" y1="9" x2="17" y2="12.5" stroke="#04121a" stroke-width="2.1"
                            stroke-linecap="round" />
                        <line x1="11.5" y1="13.5" x2="7.5" y2="20" stroke="#04121a" stroke-width="2.1"
                            stroke-linecap="round" />
                        <line x1="11.5" y1="13.5" x2="15.5" y2="20" stroke="#04121a" stroke-width="2.1"
                            stroke-linecap="round" />
                    </svg></span>
                <span className="logo-name">Move<b>Verse</b></span>
            </a>
            <ul className="nav-links">
                <li><a href="#how">How It Works</a></li>
                <li><a href="#game">The Game</a></li>
                <li><a href="#leaderboard">Leaderboard</a></li>
                <li><a href="#progress">Progress</a></li>
            </ul>
            <div className="nav-cta">
                <button className="btn btn-ghost">Sign In</button>
                <button className="btn btn-primary">Start Playing</button>
            </div>
        </div>
    </nav>
    )
  }
}

export default Header