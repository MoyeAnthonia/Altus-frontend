import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./UserMenu.module.css";

type UserMenuProps = {
  username: string;
  onLogout: () => void;
};

export function UserMenu({ username, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  // close when clicking outside, or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function goToProfile() {
    setOpen(false);
    nav("/profile");
  }

  function handleLogout() {
    setOpen(false);
    onLogout();
    nav("/login");
  }

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.greeting}>Hey, {username}</span>
        <span className={open ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}>▾</span>
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={goToProfile}
            role="menuitem"
          >
            Profile
          </button>
          <button
            type="button"
            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            onClick={handleLogout}
            role="menuitem"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
