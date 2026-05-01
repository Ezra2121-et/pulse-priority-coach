import { useMemo } from "react";
import { Sparkles } from "lucide-react";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { text: "Until we can manage time, we can manage nothing else.", author: "Peter Drucker" },
  { text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", author: "Stephen King" },
  { text: "You don't need more time, you need more focus.", author: "Unknown" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Productivity is never an accident. It is always the result of commitment to excellence.", author: "Paul J. Meyer" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Don't wait. The time will never be just right.", author: "Napoleon Hill" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
];

export function MotivationalQuote() {
  const quote = useMemo(() => {
    // Use day of year as seed so it changes daily but stays consistent within a day
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  return (
    <div className="glass rounded-xl p-4 flex items-start gap-3">
      <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-sm italic text-foreground/80">"{quote.text}"</p>
        <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>
      </div>
    </div>
  );
}
