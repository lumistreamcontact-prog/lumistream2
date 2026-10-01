import Link from "next/link";
import { SectionHeader } from "@/components/ui/Primitives";
import { ChannelCard, type ChannelCardData } from "@/components/cards/ChannelCard";

/** Horizontally scrolling shelf of channel cards. */
export function ChannelRail({
  title,
  channels,
  href,
  viewAllLabel,
}: {
  title: string;
  channels: ChannelCardData[];
  href?: string;
  viewAllLabel?: string;
}) {
  if (channels.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title={title}
        action={
          href && viewAllLabel ? (
            <Link
              href={href}
              className="shrink-0 text-sm font-medium text-brand hover:underline"
            >
              {viewAllLabel}
            </Link>
          ) : undefined
        }
      />

      <div className="rail no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {channels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} variant="rail" />
        ))}
      </div>
    </section>
  );
}