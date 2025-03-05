'use client';

import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">MSAL Auth</Link>
      </div>
      <div className={styles.links}>
        <Link href="/sign-in" className={styles.link}>Sign In</Link>
        <Link href="/sign-up" className={styles.link}>Sign Up</Link>
        <Link href="/reset-password" className={styles.link}>Reset Password</Link>
      </div>
    </nav>
  );
}
