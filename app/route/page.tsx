import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "How to Reach KITSW",
  description:
    "Travel directions to Kakatiya Institute of Technology & Science, Warangal, from Kazipet, Hanamkonda and Warangal stations.",
};

const summaryRows = [
  ["Kazipet Railway Station", "11 / 11J", "KU Cross Road", "Auto to KITSW"],
  ["Hanamkonda Bus Station", "30 / 31", "Erragattu Gutta Signal", "Walk to KITSW"],
  ["Hanamkonda Bus Station", "Pallevelugu – Parakal", "Erragattu Gutta Signal", "Walk to KITSW"],
  ["Hanamkonda Bus Station", "Pallevelugu – Siddipet", "Erragattu Gutta Signal", "Walk to KITSW"],
  ["Karimnagar", "Direct bus", "Erragattu Gutta Signal", "Walk to KITSW"],
  ["Warangal Railway / Bus Station", "11 / 11J", "KU Cross Road", "Auto to KITSW"],
];

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className={styles.steps}>{children}</ol>;
}

export default function RoutePage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.wordmark} href="/" aria-label="Happeno home">
            HAPPENO
          </Link>
          <a
            className={styles.mapLink}
            href="https://www.google.com/maps/search/?api=1&query=Kakatiya+Institute+of+Technology+%26+Science+Warangal"
            target="_blank"
            rel="noreferrer"
          >
            View KITSW on Google Maps
          </a>
        </header>

        <section className={styles.intro} aria-labelledby="page-title">
          <h1 id="page-title">How to reach KITSW</h1>
          <p>Kakatiya Institute of Technology &amp; Science, Warangal</p>
        </section>

        <div className={styles.moduleList}>
          <section className={styles.module} aria-labelledby="kazipet-title">
            <div className={styles.moduleHeading}>
              <span className={styles.moduleNumber}>01</span>
              <div>
                <p className={styles.category}>BY TRAIN</p>
                <h2 id="kazipet-title">From Kazipet Railway Station</h2>
              </div>
            </div>
            <div className={styles.moduleContent}>
              <p className={styles.routeSummary}>
                Take bus 11 or 11J towards Warangal via KU Cross Road.
              </p>
              <Steps>
                <li>Buses run approximately every 15 minutes.</li>
                <li>Buy a ticket to KU Cross Road and get off there.</li>
                <li>Take an auto from KU Cross Road to KITSW.</li>
              </Steps>
            </div>
          </section>

          <section className={styles.module} aria-labelledby="hanamkonda-title">
            <div className={styles.moduleHeading}>
              <span className={styles.moduleNumber}>02</span>
              <div>
                <p className={styles.category}>BY BUS</p>
                <h2 id="hanamkonda-title">From Hanamkonda Bus Station</h2>
              </div>
            </div>
            <div className={styles.moduleContent}>
              <div className={styles.options}>
                <article className={styles.option}>
                  <h3>City buses · 30 or 31</h3>
                  <Steps>
                    <li>Take bus 30 or 31.</li>
                    <li>Get off at Erragattu Gutta Signal.</li>
                    <li>Walk from the signal to KITSW.</li>
                  </Steps>
                </article>
                <article className={styles.option}>
                  <h3>Pallevelugu buses</h3>
                  <Steps>
                    <li>
                      <strong>Hanamkonda – Parakal</strong> via Ambala Village.
                      Buses run approximately every 30 minutes.
                    </li>
                    <li>
                      <strong>Hanamkonda – Siddipet</strong> via Bheemaram and
                      Hasanparthy.
                    </li>
                    <li>For either service, get off at Erragattu Gutta Signal and walk to KITSW.</li>
                  </Steps>
                </article>
              </div>
              <aside className={styles.note}>
                <strong>Coming from Karimnagar?</strong> Ask the bus conductor
                to stop at Erragattu Gutta Signal, then walk to KITSW.
              </aside>
              <p className={styles.footnote}>
                The bus services above are for passengers travelling from Hanamkonda Bus Station.
              </p>
            </div>
          </section>

          <section className={styles.module} aria-labelledby="warangal-title">
            <div className={styles.moduleHeading}>
              <span className={styles.moduleNumber}>03</span>
              <div>
                <p className={styles.category}>TRAIN OR BUS</p>
                <h2 id="warangal-title">From Warangal Station</h2>
              </div>
            </div>
            <div className={styles.moduleContent}>
              <p className={styles.routeSummary}>
                The Warangal Railway Station and Bus Station are next to each other.
              </p>
              <Steps>
                <li>Board bus 11 or 11J from either station.</li>
                <li>Ask for a ticket to KU Cross Road and get off there.</li>
                <li>Take an auto from KU Cross Road to KITSW.</li>
              </Steps>
              <p className={styles.footnote}>
                The bus follows the Kazipet – Warangal route via KU Cross Road.
                Buses run approximately every 15 minutes.
              </p>
            </div>
          </section>
        </div>

        <section className={styles.summary} aria-labelledby="summary-title">
          <div className={styles.summaryHeading}>
            <div>
              <p className={styles.category}>AT A GLANCE</p>
              <h2 id="summary-title">Quick route summary</h2>
            </div>
          </div>
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Starting point</th>
                  <th scope="col">Bus</th>
                  <th scope="col">Get off at</th>
                  <th scope="col">To KITSW</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map(([start, bus, stop, lastMile]) => (
                  <tr key={`${start}-${bus}`}>
                    <td>{start}</td>
                    <td>{bus}</td>
                    <td>{stop}</td>
                    <td>{lastMile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>KITSW · Warangal, Telangana</span>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Kakatiya+Institute+of+Technology+%26+Science+Warangal"
            target="_blank"
            rel="noreferrer"
          >
            Open map
          </a>
        </footer>
      </div>
    </main>
  );
}
