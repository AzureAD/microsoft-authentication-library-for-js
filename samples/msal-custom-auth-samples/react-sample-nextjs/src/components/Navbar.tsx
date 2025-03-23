"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <Link href="/">MSAL Auth</Link>
            </div>
            <div className={styles.links}>
                <Link href="/sign-in" className={styles.link}>
                    Sign In OTP/password
                </Link>
                <Link href="/sign-up" className={styles.link}>
                    Sign Up with OTP
                </Link>
                <Link href="/sign-up-password" className={styles.link}>
                    Sign Up with Password
                </Link>
                <Link href="/reset-password" className={styles.link}>
                    Reset Password
                </Link>
            </div>
        </nav>
    );
}
