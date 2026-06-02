import React, { Component } from 'react'

export  class Footer extends Component {
  render() {
    return (
          <footer>
        <div className="wrap">
            <div className="foot-top">
                <div className="foot-brand">
                    <a href="#" className="logo">
                        <span className="logo-mark" style={{ width: '34px', height: '34px', borderRadius: '9px' }}>
                            <svg
                                viewBox="0 0 23 23" fill="none" width="18" height="18">
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
                        <span className="logo-name" style={{ fontSize: '16px' }}>Move<b>Verse</b></span>
                    </a>
                    <p>Fitness reimagined as play. Real movement, real-time tracking, real progress — all in your
                        browser.</p>
                </div>
                <div className="foot-col">
                    <h6>Product</h6><a href="#how">How It Works</a><a href="#game">The Game</a><a
                        href="#leaderboard">Leaderboard</a><a href="#progress">Progress</a>
                </div>
                <div className="foot-col">
                    <h6>Company</h6><a href="#">About</a><a href="#">Privacy Policy</a><a href="#">Terms of
                        Service</a><a href="#">Contact</a>
                </div>
                <div className="foot-col">
                    <h6>Connect</h6><a href="#">GitHub</a><a href="#">Help Center</a><a href="#">Community</a><a
                        href="#">Press Kit</a>
                </div>
            </div>
            <div className="foot-bottom">
                <p>© 2026 MoveVerse. Built with MediaPipe · React · Node.js.</p>
                <div className="socials">
                    <a href="#" aria-label="X"><svg viewBox="0 0 16 16" fill="currentColor">
                            <path
                                d="M12.5 1.5h2.2l-4.8 5.5 5.6 7.5h-4.4l-3.5-4.6-4 4.6H1.9l5.1-5.9L1.6 1.5h4.5l3.1 4.2 3.3-4.2zm-.8 12.2h1.2L4.7 2.7H3.4l8.3 11z" />
                        </svg></a>
                    <a href="#" aria-label="Discord"><svg viewBox="0 0 16 16" fill="currentColor">
                            <path
                                d="M13.5 3.2A11 11 0 0010.8 2.4l-.2.3a8.4 8.4 0 013.6 1.8 9.7 9.7 0 00-8.5 0A8.4 8.4 0 015.4 2.7l-.2-.3A11 11 0 002.5 3.2 11.4 11.4 0 00.6 11.1a11 11 0 003.3 1。7l.4-.6a6。6 6。6 0 01-1-.5l。2-.2a7。8 7。8 0 006。8 0l。2。2a6。6 6。6 0 01-1 .5l。4。6a11 １１ ０ ００３。３-１。７ １１。４ １１。４ ０ ００-１。９-７。９zM５。７９。７c-.６０-１。１-.６-１。３s。５-１。３１。１-１。３１。１。６１。１１。３-.５１。３-１。１１。３zm４。６０c-.６０-１。１-.６-１。３s。５-１。３１。１-１。３１。₁ 。６₁ 。₁ 。₃-.５₁ 。₃-₁ 。₁ 。₃z" />
                        </svg></a>
                    <a href="#" aria-label="YouTube"><svg viewBox="0 0 16 16" fill="currentColor">
                            <path
                                d="M15.4 4.5a2 2 0 00-1.4-1.4C12.8 2.8 8 2.8 8 2.8s-4.8 0-6 .3A2 2 0 00.6 4.5C.3 5.7.3 8 .3 8s0 2.3.3 3.5a2 2 0 001.4 1.4c1.2.3 6 .3 6 .3s4.8 0 6-.3a2 2 0 001.4-1.4c.3-1.2.3-3.5.3-3.5s0-2.3-.3-3.5zM6.4 10.3V5.7L10.4 8l-4 2.3z" />
                        </svg></a>
                    <a href="#" aria-label="Instagram"><svg viewBox="0 0 16 16" fill="currentColor">
                            <rect x="2" y="2" width="12" height="12" rx="3.5" fill="none" stroke="currentColor"
                                stroke-width="1.3" />
                            <circle cx="8" cy="8" r="2.8" fill="none" stroke="currentColor" stroke-width="1.3" />
                            <circle cx="11.4" cy="4.6" r=".9" />
                        </svg></a>
                </div>
            </div>
        </div>
    </footer>
    )
  }
}

export default Footer