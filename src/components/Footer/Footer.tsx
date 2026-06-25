import { Link, useNavigate, useLocation } from "react-router";
import styles from "./Footer.module.css";
import logo from "../../assets/logo-icon.png";

type FooterLink = {
  label: string;
  href: string;
};

type FooterProps = {
  brand?: string;
  tagline?: string;
  quickLinks?: FooterLink[];
  gameLinks?: FooterLink[];
  team?: string[];
};

const defaultQuickLinks: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
];

const defaultGameLinks: FooterLink[] = [
  { label: "Branch Hopper", href: "#games" },
  { label: "Lily Leaper", href: "#games" },
];

const defaultTeam = ["Anthonia", "Karen", "Matthew", "Patrick"];

function formatTeam(team: string[]) {
  if (team.length <= 1) return team[0] ?? "";
  return `${team.slice(0, -1).join(", ")} & ${team[team.length - 1]}`;
}

function Footer({
  brand = "MoveVerse",
  tagline = "Turn your workout into a game.",
  quickLinks = defaultQuickLinks,
  gameLinks = defaultGameLinks,
  team = defaultTeam,
}: FooterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const year = new Date().getFullYear();

  // Same anchor-vs-route handling as Navbar: if we're not on "/", navigate
  // home first, then scroll once the page has had a tick to mount.
  const handleLinkClick = (href: string) => {
    if (href.startsWith("#")) {
      const targetId = href.slice(1);
      if (location.pathname !== "/") {
        navigate("/");
        window.setTimeout(() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className={styles.ftRoot}>
      <div className={styles.ftTop}>
        <div className={styles.ftBrandCol}>
          <Link to="/" className={styles.ftBrand}>
            <img src={logo} alt="" className={styles.ftLogo} />
            <span className={styles.ftBrandName}>{brand}</span>
          </Link>
          <p className={styles.ftTagline}>{tagline}</p>
        </div>

        <nav className={styles.ftCol} aria-label="Explore">
          <h3 className={styles.ftColTitle}>Explore</h3>
          <ul className={styles.ftLinkList}>
            {quickLinks.map((link) => (
              <li key={link.label}>
                <button
                  type="button"
                  className={styles.ftLink}
                  onClick={() => handleLinkClick(link.href)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.ftCol} aria-label="Games">
          <h3 className={styles.ftColTitle}>Games</h3>
          <ul className={styles.ftLinkList}>
            {gameLinks.map((link) => (
              <li key={link.label}>
                <button
                  type="button"
                  className={styles.ftLink}
                  onClick={() => handleLinkClick(link.href)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.ftDivider} />

      <div className={styles.ftBottom}>
        <p className={styles.ftCopy}>
          © {year} {brand}. Built by {formatTeam(team)}.
        </p>
        <button
          type="button"
          className={styles.ftTopBtn}
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <span className={styles.ftTopBtnArrow} aria-hidden="true">
            ↑
          </span>
          <span className={styles.ftTopBtnLabel}>Top</span>
        </button>
      </div>
    </footer>
  );
}

export default Footer;
