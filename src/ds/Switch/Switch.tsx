import styles from "./Switch.module.css";

/** On or off, said at once: the track turns green, the knob slides. Always named. */
export default function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={styles.switch} onClick={() => onChange(!checked)}>
      <span className={styles.track} aria-hidden="true"><span className={styles.knob} /></span>
    </button>
  );
}
