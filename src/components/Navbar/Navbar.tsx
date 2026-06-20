import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";
import Button from "../Button/Button";
import { useNavigate, Link } from "react-router";
import logo from "../../assets/logo-icon.png";
import { useAuth } from "../../context/useAuth";
import { UserMenu } from "../UserMenu/UserMenu";

type NavItems = {
  label: string;
  href: string;
};

type NavbarProps = {
  brand?: string;
  links?: NavItems[];
};

const defaultLinks: NavItems[] = [
  { label: "Features", href: "#features" },
  { label: "Who It's For", href: "#audience" },
  { label: "Games", href: "#games" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar({ brand = "MoveVerse", links = defaultLinks }: NavbarProps) {
  const nav = useNavigate();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // 👇 active section state
  const [activeSection, setActiveSection] = useState("");

  const navGames = () => {
    nav("/level");
  };
  const navLogin = () => {
    nav("/login");
  };

  // the browser's IntersectionObserver API to detect which section is on screen.
  // highlight the href link in the navbar when it is in an active state
  // Only observe sections on the home page
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.5, // section is "active" when 50% visible
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <nav className={styles.navbar}>
      {/* Logo */}
      <Link to="/" className={styles.brandLogo}>
        <img src={logo} alt="Moveverse Logo" width="40" height="40" />
        <span className={styles.brandName}>{brand}</span>
      </Link>

      {/* Mobile toggle */}
      <Button
        className={styles.toggle}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        label={open ? "✕" : "☰"}
      />

      {/* Links */}
      <div className={`${styles.menu} ${open ? styles.open : ""}`}>
        <ul className={styles.links}>
          {links.map((item) => {
            // const isAnchor = item.href.startsWith("#");

            return (
              <li key={item.label}>
                {/* SECTION LINKS */}

                <a
                  href={item.href}
                  className={
                    activeSection === item.href.slice(1)
                      ? `${styles.link} ${styles.active}`
                      : styles.link
                  }
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Actions */}
        <div className={styles.actions}>
          {isAuthenticated ? (
            <>
              <Button
                onClick={navGames}
                label="Start Playing"
                variant="primary"
                aria-label="Start Game"
              />
            </>
          ) : (
            <Button
              onClick={navLogin}
              label="Start Playing"
              variant="primary"
              aria-label="Start Game"
            />
          )}
          {isAuthenticated ? (
            <>
              {/* <span>Hey, {user?.username} 👋</span> */}
              <UserMenu username={user?.username ?? "Player"} onLogout={logout} />
            </>
          ) : (
            <Button
              onClick={navLogin}
              label="Sign In"
              variant="secondary"
              aria-label="Sign in Account"
            />
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
