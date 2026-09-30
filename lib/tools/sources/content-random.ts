import type { ToolContent } from "../content";

/** Long-form copy for the random tools. Merged into TOOL_CONTENT. */
export const RANDOM_CONTENT: Record<string, ToolContent> = {
  "coin-flip": {
    intro:
      "Flipping a coin is the oldest way to settle a choice between two options, and a good virtual coin should be as fair as a real one. This one is. Each toss takes a random bit from your device's cryptographic generator, so heads and tails are exactly equally likely and no flip depends on the one before. Flip a single coin for a decision, or up to 100 at once to see how chance behaves, rename the sides to your own two options, and keep a tally of heads, tails and streaks for the session.",
    howTo: {
      title: "How to flip a coin online",
      steps: [
        "Press “Flip the coin”. The coin spins and lands on heads or tails.",
        "To decide between two things, rename the sides under Options: for example Pizza and Sushi, or Yes and No.",
        "Set the number of coins to flip several at once. The result shows how many of each side came up.",
        "Watch the session panel for the running totals, percentages and longest streak.",
        "Press Reset to clear the tally and start again.",
      ],
    },
    useCases: [
      {
        title: "Settling a tie",
        body: "Kick-off choices, who goes first in a game, which of two equal options to pick: name the sides and let the coin decide.",
      },
      {
        title: "Teaching probability",
        body: "Flip 10, 100 or 1,000 coins and compare what happens with what you expect. It is a hands-on way to see the law of large numbers: the proportion of heads drifts towards 50% as flips accumulate, though the gap in counts can still grow.",
      },
      {
        title: "Running a quick experiment or game",
        body: "Tabletop games, classroom activities and stats exercises often need many independent flips quickly. Flip up to 100 in one go.",
      },
    ],
    tips: [
      "A streak of five or six in a row is normal in 100 fair flips. Past results do not change the next one.",
      "If you feel disappointed by the result, that tells you which option you really wanted.",
      "Turn on reduced motion in your system settings and the coin lands without the spin.",
      "For more than two options use the Random Name Picker or Dice Roller instead.",
      "Real coins are very slightly biased towards the side they start on (about 50.8% in a large 2023 experiment), which a virtual coin does not suffer from.",
    ],
    extraFaqs: [
      {
        question: "Is a digital coin flip as fair as a real one?",
        answer: "It can be fairer. A real coin is fractionally more likely to land on the side it started facing, while a cryptographic random bit is an exact 50/50 with no physical bias.",
      },
      {
        question: "Does the animation affect the result?",
        answer: "No. The result is drawn first and the coin is then animated to land on it. The spin is decoration only.",
      },
      {
        question: "Are my flips stored or shared?",
        answer: "No. The tally lives in the page and disappears when you close it. Only your side names are remembered on your device for a few days.",
      },
    ],
  },

  "dice-roller": {
    intro:
      "Whether you are playing a board game, running a role-playing session or teaching probability, a dice roller needs to be fair and to understand the notation players actually use. This one rolls any standard die from d4 to d100 and reads full dice notation: 2d6+3, 4d6kh3 to keep the highest three, 2d20kh1 for advantage, exploding dice and Fate dice. It shows every die, strikes through dropped ones, reports the range and average, and charts the exact odds of each total.",
    howTo: {
      title: "How to roll dice online",
      steps: [
        "On “Pick dice”, choose the die type, how many dice to roll and an optional modifier, then press Roll.",
        "For anything more complex, switch to “Dice notation” and type it, such as 2d6+3 or 4d6kh3. Presets cover advantage, disadvantage, ability scores and more.",
        "Read the result: the total, each die, dropped dice struck through, and the range and average for the roll.",
        "For ordinary rolls of several dice, read the chart to see how likely each total is. The dark bar is the one you rolled.",
        "Earlier rolls are listed under Recent rolls.",
      ],
    },
    useCases: [
      {
        title: "Role-playing games",
        body: "Roll attack and damage dice, ability scores (4d6 drop lowest), advantage and disadvantage and percentile checks without hunting for physical dice.",
      },
      {
        title: "Board and classroom games",
        body: "Roll a d6 for Monopoly or Ludo, or use a d10 or d12 for classroom activities, from any device with a browser.",
      },
      {
        title: "Learning probability",
        body: "Roll 2d6 many times and compare with the chart: seven is six times as likely as two or twelve, which is why it dominates many board games.",
      },
    ],
    tips: [
      "The middle totals of several dice are far more likely than the extremes: sum dice follow a bell-shaped curve.",
      "2d20kh1 (advantage) raises a d20 roll's success chance by up to 25 percentage points, most for targets near 11.",
      "In exploding notation (1d6!) a maximum roll adds another die, so there is no upper limit.",
      "Modifiers apply once per roll, not to each die.",
      "You can roll up to 200 dice at once; results stay readable up to about 40.",
    ],
    extraFaqs: [
      {
        question: "How likely is each total with two six-sided dice?",
        answer: "There are 36 combinations: 7 comes up 6 times in 36 (16.7%), 6 and 8 five times each (13.9%), down to 2 and 12 once each (2.8%). Any other pair of dice follows the same pattern.",
      },
      {
        question: "What is a d% or percentile die?",
        answer: "A roll from 1 to 100, historically made with two ten-sided dice. Type d% or d100.",
      },
      {
        question: "What are Fate or Fudge dice?",
        answer: "Dice with faces of minus, blank and plus (−1, 0, +1), used by the Fate role-playing system. Four of them (4dF) give a bell-shaped result from −4 to +4.",
      },
    ],
  },

  "random-number-generator": {
    intro:
      "Most online random number generators lean on Math.random(), which is fast but predictable and, in some engines, slightly uneven. This one uses your device's cryptographic random generator and an unbiased method of turning its output into a range, so every number in your range is exactly as likely as any other. Pick a range and a count, choose whole numbers or decimals, forbid repeats for draws, pad with zeros for PINs and sort the results. Presets cover the common jobs.",
    howTo: {
      title: "How to generate random numbers",
      steps: [
        "Choose a preset, or type the lowest and highest number you want.",
        "Set how many numbers to generate, up to 10,000.",
        "Turn on “No repeats” for draws where each number can appear only once, and choose decimal places if you want fractions.",
        "Choose the order and, for PINs and codes, pad with leading zeros to a fixed width.",
        "Press Generate, then copy the numbers with the separator you prefer.",
      ],
    },
    useCases: [
      {
        title: "Giveaways and raffles",
        body: "Number the entries and draw a winning number. Use No repeats to draw several different winners.",
      },
      {
        title: "Sampling and testing",
        body: "Pick a random subset of rows, generate test data within a range, or choose unbiased sample sizes.",
      },
      {
        title: "Games and decisions",
        body: "Choose a number for a guessing game, pick a random page or chapter, or pick lottery-style sets with no repeats.",
      },
    ],
    tips: [
      "For No repeats, the count cannot exceed the number of values in the range.",
      "Random does not mean evenly spread: clusters and repeats are normal when repeats are allowed.",
      "For passwords or tokens use the Password Generator, which offers the right character sets.",
      "Decimal mode rounds to the places you choose; the limits are included.",
      "Use “As drawn” to see the order the numbers came out in.",
    ],
    extraFaqs: [
      {
        question: "What is modulo bias?",
        answer: "A common shortcut to fit a random value into a range is to take it modulo the range. When the range does not divide evenly into the generator's output, some numbers come up slightly more often. This tool discards the few draws that would cause that, so the result is exactly uniform.",
      },
      {
        question: "Can this tool predict or favour numbers?",
        answer: "No. Each result is a fresh draw from the operating system's secure generator, and nothing about previous draws influences the next.",
      },
      {
        question: "Is there a limit on the range?",
        answer: "Whole numbers can be anywhere within ±9 quadrillion (the largest integers JavaScript stores exactly). You can ask for up to 10,000 numbers at once.",
      },
    ],
  },

  "random-name-picker": {
    intro:
      "Choosing a winner, a volunteer or a presenter fairly is easier when everyone can see it being done. Paste your names, one per line, and spin the wheel, draw several winners at once or shuffle everyone into teams. The winner is decided by an unbiased draw before the wheel starts to turn, so the animation can never tilt the result. It works for classrooms, giveaways, stand-ups and family decisions, and your list stays in your browser.",
    howTo: {
      title: "How to pick a random name",
      steps: [
        "Type or paste your names or options into the box, one per line. Use the quick fill buttons to try an example.",
        "To choose one winner, stay on “Spin the wheel” and press Spin. Turn on “Remove the winner after each spin” to draw a name at a time without repeats.",
        "To choose several, open “Draw winners”, set how many, and press Draw.",
        "To split a group, open “Make teams”, choose the number of teams or the size of each team, and press Make teams.",
        "Copy the winners or the teams to share them.",
      ],
    },
    useCases: [
      {
        title: "Classrooms",
        body: "Pick who answers next, who presents first or how to group students for an activity, and let everyone see that the choice is fair.",
      },
      {
        title: "Giveaways and raffles",
        body: "Paste the list of entrants and draw one or several winners. Because picks are unbiased, you can point to the method if anyone questions the result.",
      },
      {
        title: "Team and meeting decisions",
        body: "Decide who goes first in stand-up, who takes notes, or split a group into balanced teams for a game.",
      },
    ],
    tips: [
      "A repeated name gets extra chances, which suits weighted draws. Remove duplicates if you want one chance each.",
      "With more than about 36 entries the wheel hides its labels to stay readable. The winner is still shown in full.",
      "“Draw winners” gives every possible set of winners the same probability.",
      "Teams differ in size by at most one person, however many you ask for.",
      "Lists with real people's names are saved only in your browser, for a few days; clear them with the “Clear local data” button on the Privacy page.",
    ],
    extraFaqs: [
      {
        question: "Can I trust the wheel for an official draw?",
        answer: "The selection itself is sound: a cryptographically secure, unbiased draw. For a legally regulated raffle, follow the rules that apply to you and keep your own record of the entries and result.",
      },
      {
        question: "What happens when the list has only one entry?",
        answer: "The wheel is a single slice and always lands on it. Add at least two entries for a real draw.",
      },
      {
        question: "Why does the wheel not show every name when there are many?",
        answer: "Text becomes unreadably small beyond about 36 slices, so labels are hidden while the wheel still works. The winning name is always displayed in full underneath.",
      },
    ],
  },
};
