import titleGameplay from '../../assets/title-gameplay-v1.png';

/** Title key art based on the game's U-shaped track, independent of simulation. */
export function TitleIllustration() {
  return <img className="title-illustration" src={titleGameplay} width={1254} height={1254}
    alt="A green ball follows a U-shaped track through three golden stars toward the exit. A message says: Turn off gravity."
    fetchPriority="high" decoding="async" />;
}
