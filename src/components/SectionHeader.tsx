interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
}

const SectionHeader = ({ icon, title, subtitle }: SectionHeaderProps) => (
  <div className="mb-6">
    <h2 className="font-display text-2xl font-bold flex items-center gap-2">
      <span>{icon}</span>
      <span className="text-gradient-gold">{title}</span>
    </h2>
    {subtitle && <p className="text-muted-foreground text-sm mt-1 ml-9">{subtitle}</p>}
  </div>
);

export default SectionHeader;
