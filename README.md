# SaltyBananaSlug's Games

A collection of party-game projects by **SaltyBananaSlug**.

## Installing Games in Foundry VTT

Each Foundry game in this repository gets a permanent manifest URL for installing and updating it.

1. Open **Foundry VTT Setup**.
2. Go to **Add-on Modules**.
3. Click **Install Module**.
4. Copy the game's URL from the table below and paste it into **Manifest URL**.
5. Click **Install**.

### Direct Manifest URLs

| Game | Version | Foundry Manifest URL |
| --- | --- | --- |
| **RatSlug** | **0.1.6.0** | `https://raw.githubusercontent.com/M0tleyDrew/Games/games-catalog/manifests/saltybananaslugs-ratslug.json` |

The manifest URL stays the same between updates. When a game's version changes on `main`, the repository automatically rebuilds its Foundry manifest and versioned install ZIP on the `games-catalog` branch.

---

## RatSlug

**RatSlug** is a system-independent Foundry VTT v13 social-deduction and improv party game. Players invent ridiculous personas, answer prompts and chat in character, then try to work out which real player is behind each persona.

The current build is **v0.1.6.0**.

### How a game works

1. The host starts RatSlug and players create anonymous fake profiles with a name, age, pronouns, location, profession, biography, catchphrase, and image.
2. Once profiles are locked, everyone can browse them from the **Profiles** tab without seeing the real player behind each persona.
3. The host runs a round of exactly four prompts. Players can answer any unanswered prompt until identity voting opens.
4. Players can also talk publicly or privately in character while protecting their real identities.
5. After prompt four, every player matches each persona to a real player and chooses a Favorite Character.
6. Identity guesses and Favorite votes lock together when submitted.
7. The host scores the round. Each correct identity match is worth one point.
8. Beginning in round two, the lowest eligible scorer is revealed. Ties use current-round score as a tiebreaker, with the host resolving any remaining tie.
9. Revealed players stay in the game but are no longer eligible for the primary win.
10. An unrevealed player who correctly identifies the entire group wins immediately; otherwise the final unrevealed player wins. Multiple perfect players can share the win.
11. Favorite Character votes are tracked separately and may also produce co-winners.
12. When the game ends, Final Results reveal every persona's real player identity, final score, Favorite vote total, and winner summaries.

### Current quality-of-life features

- Mobile-first interface and floating launcher.
- Expanded fake profiles: name, age, pronouns, location, profession, biography, catchphrase, and image.
- Dedicated Profiles tab for browsing every locked fake profile while real identities remain hidden.
- 100 built-in prompts plus custom prompts, no-repeat random drawing, discarding, and deck reset.
- Old prompts remain answerable until voting opens.
- Newest prompts appear first.
- Synchronized updates preserve unsent drafts, scroll position, focus, and cursor position.
- Other players joining, saving personas, or submitting responses do not wipe what someone else is typing.
- Saved personas lock permanently, including after reconnecting.
- Public and persona-to-persona private chat.
- Host pause/resume controls.
- Host identity protection: the Host tab shows character information and status without exposing Foundry account names or persona-to-player mappings before normal reveals.
- Automatic round scoring, reveal logic, Favorite tracking, winner detection, and full finale reveal.

### Installation

Use the RatSlug manifest URL in the **Direct Manifest URLs** table above for normal Foundry installation and updates.

For manual local testing, copy the `saltybananaslugs-ratslug` folder into your Foundry user data `Data/modules/` directory, restart Foundry, and enable **SaltyBananaSlug's RatSlug** in your world.

The module is system-independent and targets **Foundry VTT v13**.

For implementation notes and version history, see [`saltybananaslugs-ratslug/README.md`](saltybananaslugs-ratslug/README.md).
