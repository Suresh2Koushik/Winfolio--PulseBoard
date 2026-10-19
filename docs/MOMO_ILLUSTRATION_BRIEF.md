# Momo: illustration brief

A brief for an illustrator to turn Momo, Winfolio's mascot, from a code-drawn first draft into a finished character set.

## About Winfolio

Winfolio is a personal work journal. People log their "wins" (anything they got done, big or small), write short weekly reflections, and turn it all into a performance review at the end of the quarter. The tone is warm, playful and encouraging, never corporate. The tagline on the home page is "You did a lot this week. Your brain disagrees."

## Who Momo is

- A small **notebook** with a face, arms and legs: the journal itself, come to life.
- Personality: cheerful, proud of you, a little goofy. Momo celebrates your progress; it never nags or judges.
- Momo is decorative. It appears next to messages and never carries information on its own.

The current draft lives in `src/components/landing/Mascot.tsx` (an inline SVG, 120 × 140 viewBox). Please keep the overall idea (a violet notebook with a spiral binding, a pink bookmark ribbon and rosy cheeks) and make it feel finished and ownable.

## Brand colours

| Role | Colour |
|---|---|
| Ink (outlines, text) | `#0B0B12` |
| Paper / white | `#FFFFFF` |
| Light violet (Momo's body today) | `#ECE6FF`, deeper accent `#5B21B6` |
| Light pink (cheeks, bookmark) | `#FFE1EC`, deeper accent `#9D174D` |
| Light blue | `#DCEBFF`, deeper accent `#1E40AF` |

Style: flat colour, a confident ink outline (about 4px at 120px tall), no gradients, no photographic textures. It should sit comfortably next to the Plus Jakarta Sans typeface and the hand-drawn "doodle" accents (stars, squiggles, arrows) on the home page.

## Poses needed

**Must-have (in use today):**

1. **Idle**: standing, friendly, relaxed. Used on the home page, empty states, the "Log a win" card.
2. **Celebrate**: arms up, open smile, mid-jump. Used when a win is saved, a goal is completed, or a review PDF is downloaded (shown with confetti).
3. **Thumbs-up**: proud grin, one thumb up. Used when a weekly reflection is saved.

**Nice to have (planned):**

4. **Thinking**: pencil to chin. For "What did you get done?" prompts and reflection reminders.
5. **Waving**: hello or goodbye. For onboarding and sign-in.
6. **Sleepy / waiting**: for loading states.
7. **Oops**: apologetic but still cheerful, for errors and the 404 page (never sad or crying).
8. **Reading a long list**: for the performance review screen.

## Sizes and where Momo appears

Momo must read clearly from very small to large:

| Size (height) | Where |
|---|---|
| ~56px | The pop-up "Win saved! Look at you go." card at the bottom of the screen |
| ~80px | The "Got a win?" card on Home |
| ~96px | Empty states (no wins yet, no reflections yet) |
| ~128px+ | The home (landing) page hero and story sections |

At 56px the face, arms and outline must still be recognisable. Please test every pose at that size.

## Light and dark backgrounds

The app now has a dark theme (background about `#101016`, cards about `#18181F`). Momo must look good on both white and that dark background, without a separate dark version if possible. A light body with the ink outline works today; please keep that contrast. If an outline disappears on dark, a thin light "sticker" edge around the whole figure is fine.

## Motion (for reference)

Today's draft animates in code: idle breathing and blinking; a celebrate jump. Animations are switched off for people who ask their device for reduced motion, so **every pose must work as a still image**. If you want to suggest motion, separate layers (arms, eyes, mouth, body) make it easy to animate in code later.

## Deliverables

- One **SVG per pose**, on a transparent background, in a shared 120 × 140 (or similar, consistent) artboard so poses can be swapped without layout jumps.
- Layers named by part (body, face, eyes, mouth, arms, legs, binding, ribbon) where practical.
- No embedded raster images or fonts. Keep the SVGs small (ideally under 10 KB each).
- A one-page sheet showing all poses together at 56px and 128px, on white and on `#101016`.
- Source files (Figma, Illustrator or similar).
- **Full rights** to use and modify the character commercially, including in the product, marketing and merchandise.

## Out of scope

- Logo changes (the Winfolio mark stays as is).
- Animation production (it will be done in code).
