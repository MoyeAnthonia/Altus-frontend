import { useState } from "react";
import styles from "./Navbar.module.css";
import Button from "../Button/Button";
import logo from "../../assets/logo-icon.png";

// declare the props Data type
type NavLink = {
  label: string;
  href: string;
};

type NavbarProps = {
  brand?: string;
  links?: NavLink[];
};

// Array of Links
const defaultLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Who It's For", href: "#audience" },
  { label: "Games", href: "#games" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar({
  brand = "MoveVerse",
  links = defaultLinks,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  return (
    <nav className={styles.navbar}>
      <a href="#" className={styles.brandLogo}>
      
         <img src={logo} alt="Moveverse Logo" width="40" height="40" />

        <span className={styles.brandName}>{brand}</span>
      </a>

   <Button
   className={styles.toggle}
        aria-label="Toggle navigation menu"
             aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        label= {open ? "✕" : "☰"}
      />
{/* Mapping the links array */}
      <div className={`${styles.menu} ${open ? styles.open : ""}`}>
        <ul className={styles.links}>
          {links.map((item) => (
            <li key={item.label}>
              <a href={item.href} className={styles.link}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
                <Button
        label="Start Playing"
        variant="primary"
        aria-label="Start Game"
      />
   <Button
        label="Sign In"
        variant="secondary"
        aria-label="Sign in Account"
      />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
