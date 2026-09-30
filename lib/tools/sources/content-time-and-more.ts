import type { ToolContent } from "../content";

/** Long-form copy for the timers, the speed test and the regex builder. Merged into TOOL_CONTENT. */
export const TIME_AND_MORE_CONTENT: Record<string, ToolContent> = {
  "countdown-timer": {
    intro:
      "A countdown timer is for anything with a fixed length: boiling an egg, a presentation slot, an exam section, a break. This one runs up to six timers at once, each with its own label, and rings when one finishes, even if you are in another tab. It puts the time left in the browser tab's title, offers a notification for when you are elsewhere, and survives a page reload. A second mode counts down to a date and time, like New Year or a deadline, in days, hours, minutes and seconds.",
    howTo: {
      title: "How to use the countdown timer",
      steps: [
        "Set the time with the hours, minutes and seconds boxes, a preset button, or type a time such as 25 min or 1h 15m.",
        "Give the timer a label if you run several, then press Start. Press Pause to hold it and Resume to carry on.",
        "Use +1 min to add time while it runs, or Reset to go back to the starting time.",
        "When time is up the alarm sounds until you press Stop alarm. Pick a different sound or switch on notifications under Alerts.",
        "To count to a date, choose “Count down to a date”, enter the event and its date and time, or use a shortcut such as New Year.",
      ],
    },
    useCases: [
      {
        title: "Cooking and everyday timing",
        body: "Run separate timers for the pasta, the sauce and the bread, each labelled, and know which one is ringing.",
      },
      {
        title: "Classrooms, exams and presentations",
        body: "Show a large timer for a test section or a talk, and see the remaining time even when the window is small, in the tab title.",
      },
      {
        title: "Counting down to an event",
        body: "Keep a countdown to a launch, a holiday or an exam open in a tab, with days, hours, minutes and seconds left.",
      },
    ],
    tips: [
      "Keep the tab open: the alarm is played by the page. Timers keep accurate time in the background, but closing the tab stops the sound.",
      "Pressing Start unlocks audio, which browsers require before a page may play sound.",
      "Silent mode on a phone silences web audio. Turn on vibration or notifications as a backup.",
      "Add time with +1 min without restarting the timer.",
      "Timers are saved for a few days, so a reload does not lose a timer that is still running.",
    ],
    extraFaqs: [
      {
        question: "How accurate is the timer?",
        answer: "It is based on the device clock rather than counting ticks, so it does not drift when the browser slows a background tab. The display updates four times a second and the alarm fires within a fraction of a second of the end time.",
      },
      {
        question: "Can I set a timer longer than 24 hours?",
        answer: "Yes, up to 99 hours 59 minutes 59 seconds. For longer periods use the date countdown.",
      },
      {
        question: "Does the date countdown account for time zones?",
        answer: "It counts down to the date and time you enter in your device's local time zone. For an event in another zone, convert the time first with the World Clock.",
      },
    ],
  },

  "pomodoro-timer": {
    intro:
      "The Pomodoro Technique turns a long, vague work session into short, focused sprints: 25 minutes of work, a 5-minute break, and a longer break every fourth round. The structure keeps you starting, and the breaks keep you fresh. This timer runs the whole cycle for you, rings at each change, can roll straight into the next phase, counts your sessions for the day against a goal and keeps the time in the tab title so you can see it while you work elsewhere.",
    howTo: {
      title: "How to use the Pomodoro timer",
      steps: [
        "Optionally type what you are working on, then press Start. The timer counts down your first focus session.",
        "Work on that one thing until the alarm rings. Do not switch tasks.",
        "Take the short break when the next phase begins. After four focus sessions you get a long break.",
        "Press Skip to move on early, or choose Focus, Short break or Long break to jump to a phase. Reset returns to the first focus session.",
        "Open Timing to choose a preset (classic 25/5, deep work 50/10, 90/20) or set your own lengths, and turn on auto-start if you want phases to follow each other.",
      ],
    },
    useCases: [
      {
        title: "Studying",
        body: "Break a revision day into sessions, with short breaks to move and a longer rest after a block, and watch your completed sessions build up against a goal.",
      },
      {
        title: "Deep work and coding",
        body: "Use longer blocks, such as 50/10 or 90/20, for tasks that need sustained concentration, with the screen kept awake.",
      },
      {
        title: "Beating procrastination",
        body: "Committing to just one 25-minute session lowers the barrier to starting a task you have been avoiding.",
      },
    ],
    tips: [
      "Write down distractions as they come up and deal with them in the break.",
      "Stand up and move away from the screen on breaks, rather than checking your phone.",
      "If a session is interrupted and you cannot resume it, reset and start a fresh one.",
      "Try longer focus blocks if 25 minutes feels too short to get into flow.",
      "The session counter resets every day; your goal and settings stay.",
    ],
    extraFaqs: [
      {
        question: "Why 25 minutes?",
        answer: "It was the length Francesco Cirillo found workable when he developed the method as a student in the late 1980s. There is nothing magical about it: the point is a fixed, short, single-task block. Many people prefer 50 or even 90 minutes.",
      },
      {
        question: "What counts as a completed session?",
        answer: "A focus phase that runs to the end. Skipping a focus phase early does not count.",
      },
      {
        question: "Will it alert me if I am in another app?",
        answer: "Keep the tab open for the sound; turn on notifications for a pop-up when a phase ends. The time also appears in the browser tab's title.",
      },
    ],
  },

  "interval-timer": {
    intro:
      "Interval training alternates hard effort with rest, and it only works if the timing is exact. This interval timer is built for that: set a get-ready period, work and rest lengths, rounds and sets, or pick a classic such as Tabata, HIIT 30/30, EMOM, three-minute boxing rounds or a circuit. A large display shows the current interval, round and set, what is next and the total time left; tones mark each change and the last three seconds count you in. It works full screen on a phone or a TV.",
    howTo: {
      title: "How to set up an interval workout",
      steps: [
        "Pick a preset (Tabata, HIIT, EMOM, boxing, circuit) or set your own under Workout.",
        "Set the get-ready time, the work and rest lengths, the number of rounds and sets, and any rest between sets or cool-down.",
        "Press Start. The display shows the current interval in large numbers, with the round and set.",
        "Listen for the tone at each change and the three-second countdown. Use the arrows to skip or go back, and Pause if you need to stop.",
        "Use the full-screen button to put the timer on a phone propped up, or on a TV, and turn sound off under Sound and screen if you prefer silence.",
      ],
    },
    useCases: [
      {
        title: "HIIT and Tabata workouts",
        body: "Set hard efforts of 20 to 40 seconds with short rests and let the tones tell you when to go and when to stop.",
      },
      {
        title: "Boxing, martial arts and sparring",
        body: "Use three-minute rounds with one-minute rests for as many rounds as your session needs.",
      },
      {
        title: "Timed study or practice blocks",
        body: "Alternate focused practice and rest for music, language drills or any task that benefits from fixed intervals.",
      },
    ],
    tips: [
      "Include a 10-second get-ready period so you are in position when the first work interval starts.",
      "For EMOM, set work to 60 seconds and rest to 0: a tone sounds at the start of each minute.",
      "Keep the screen awake: the timer asks for it, but phones may override it in battery saver mode.",
      "Sets are useful for circuits: rounds are the exercises, and the rest between sets is a longer recovery.",
      "Use Back to restart the current interval, or press it twice within two seconds to go to the previous one.",
    ],
    extraFaqs: [
      {
        question: "What is the difference between rounds and sets?",
        answer: "A round is one work interval plus its rest. A set is a group of rounds, for example eight Tabata rounds, followed by a longer break before the next set.",
      },
      {
        question: "Does it stay accurate if I pause or skip?",
        answer: "Yes. Everything is calculated from elapsed time, so pausing, skipping and going back recalculate exactly and the timing does not drift.",
      },
      {
        question: "Can I use it without sound?",
        answer: "Yes. Set the alarm sound to Silent under Sound and screen, and follow the colour change and large display. Vibration and notifications are also available.",
      },
    ],
  },

  "world-clock": {
    intro:
      "Working across time zones means constantly asking “what time is it there?” and “when can we all meet?”. Add the cities you care about and this page shows each one's current time, date, UTC offset and whether daylight saving time is in force, with a sun or moon to show who is awake. Switch to the meeting planner to lay out a full day for every city, shaded for working hours, so the best overlap is obvious. Offsets come from your browser's time-zone database, so they follow the real rules for any date.",
    howTo: {
      title: "How to compare time zones and plan a meeting",
      steps: [
        "On World clocks, search for a city or country, or type an IANA zone name such as Asia/Kolkata, and add it. Remove a city with the ✕ on its card.",
        "Use Display to switch between 12-hour and 24-hour time and to show seconds.",
        "Open Meeting planner, choose the date, the time zone whose hours form the columns, and the working day for your team.",
        "Read the grid: green cells are working hours, dark cells are night, and a bright column means everyone is available. The summary names the best hours.",
        "Select a column to see the time in every city, and use Copy this schedule to share it.",
      ],
    },
    useCases: [
      {
        title: "Scheduling with a remote team",
        body: "Find the hours when engineers in Bengaluru, London and New York are all at work, instead of trading messages about it.",
      },
      {
        title: "Calling family or clients abroad",
        body: "Check that it is not the middle of the night before you ring, and see whether daylight saving has changed the gap.",
      },
      {
        title: "Planning travel and events",
        body: "Convert a webinar or match start time to several zones for the day, including around clock changes.",
      },
    ],
    tips: [
      "Daylight saving starts and ends on different dates in different countries, so the gap between two cities can change for a few weeks.",
      "India, China and Japan do not observe daylight saving time.",
      "Always include the time zone (or UTC) when you send a meeting time.",
      "A day shift marker (+ or −) in the planner shows a cell is on the next or previous day.",
      "Use UTC as a neutral reference when a meeting involves more than three zones.",
    ],
    extraFaqs: [
      {
        question: "What is an IANA time zone name?",
        answer: "The standard identifier for a region's clock rules, such as Europe/London or America/New_York. It is more precise than an abbreviation like EST, because it includes the region's daylight-saving history.",
      },
      {
        question: "Why are some zone abbreviations shown as GMT+5:30?",
        answer: "Your browser shows a short name only where one is widely used. For others, such as India, it shows the offset from UTC.",
      },
      {
        question: "How accurate is the time?",
        answer: "It uses your device's clock. If your computer's clock is wrong, every city will be off by the same amount.",
      },
    ],
  },

  "internet-speed-test": {
    intro:
      "An internet speed test answers a simple question, “how fast is my connection right now?”, but a single download number hides the things that decide whether video calls stutter and games lag. This test measures four: download and upload throughput using several parallel streams, idle latency and jitter, and latency while the connection is busy. The last is bufferbloat, the extra delay that appears when something else is downloading. It runs in your browser against Cloudflare's public test servers and tells you what your speed is good for.",
    howTo: {
      title: "How to test your internet speed",
      steps: [
        "Close other downloads, streams and video calls, and if you can, use a cable or sit close to your Wi-Fi router.",
        "Choose Quick for a check of about 15 seconds that uses up to roughly 90 MB, or Full for faster connections.",
        "Press Start test and wait while it measures latency, then download, then upload.",
        "Read the results: speed, ping, jitter and how responsive the connection stays under load.",
        "Check “What this speed is good for” to see whether it suits streaming, calls, gaming and uploads, and run it again at different times of day to compare.",
      ],
    },
    useCases: [
      {
        title: "Checking what you pay for",
        body: "Compare the measured speed with your plan on a wired connection, at different times of day, to see whether a problem is your provider or your Wi-Fi.",
      },
      {
        title: "Diagnosing laggy calls and games",
        body: "A fast connection with high latency or heavy bufferbloat still feels slow. The under-load reading shows whether the router queues traffic badly.",
      },
      {
        title: "Testing a new router or mesh setup",
        body: "Run the test in different rooms to find weak spots, and again after changing channels or moving the router.",
      },
    ],
    tips: [
      "Wi-Fi is usually the bottleneck. Test wired to see the line's real speed.",
      "A VPN adds a detour and lowers speed. Turn it off for a baseline.",
      "Results vary with time of day and the route to the test server. Take several readings.",
      "Bufferbloat is fixed on the router with SQM or smart queue management, where the firmware supports it.",
      "A browser test is capped by the browser and device. Very fast lines may show lower numbers than a native app.",
    ],
    extraFaqs: [
      {
        question: "What is a good internet speed?",
        answer: "About 25 Mbps handles 4K streaming and video calls for one or two people. Busy households with several users benefit from 100 Mbps or more. For gaming, low latency (under 50 ms) and steady jitter matter more than raw speed.",
      },
      {
        question: "What is jitter?",
        answer: "How much latency varies from one measurement to the next. A connection with low average ping but high jitter feels choppy in calls and games.",
      },
      {
        question: "Does the test share my data?",
        answer: "It exchanges test data with Cloudflare's speed-test servers, which see your IP address like any site you visit. The page does not send anything else, and your recent results are kept only in your browser.",
      },
    ],
  },

  "regex-builder": {
    intro:
      "Regular expressions are powerful and famously hard to read. This builder lets you assemble one from plain-language blocks instead: the text “https://”, one or more digits, between two and four letters, one of cat, dog or bird, a group with a name. As you add blocks the expression, a plain-English reading of it and the highlighted matches in your test text all update live. Text is escaped for you, repeats are wrapped correctly, and the finished expression can be copied or exported as code for eight languages.",
    howTo: {
      title: "How to build a regular expression",
      steps: [
        "Start from one of the examples, such as email, date or phone number, or choose Clear all to begin with nothing.",
        "Use “Add a block” to add pieces in the order they should appear: text, digits, letters, a set of characters, options, a group, or an anchor such as the start of the text.",
        "For each block set how many times it should repeat: once, optional, one or more, exactly N, or between N and M.",
        "Paste text into “Try it” to see the matches highlighted. Turn the flags on or off: find all, ignore case, multiline.",
        "Copy the expression, pick a language to export it as code, or open it in the Regex Tester to go further.",
      ],
    },
    useCases: [
      {
        title: "Validating form input",
        body: "Build a pattern for a postcode, a mobile number, a PAN or a username, and test it against good and bad examples before it goes into your code.",
      },
      {
        title: "Extracting data from text",
        body: "Pull dates, prices, IDs or hashtags out of logs, emails and documents with groups that capture just the part you want.",
      },
      {
        title: "Learning regular expressions",
        body: "See how each block becomes syntax, and read the English description of the result, to learn the notation by doing.",
      },
    ],
    tips: [
      "Anchors ^ and $ make a pattern match the whole text; leave them out to find matches inside longer text.",
      "“As few as possible” (lazy) repeats stop at the first possible place, which matters for things like quoted strings.",
      "Use a named group so your code can read results by name instead of by number.",
      "Look-arounds check the surroundings without including them in the match, which is useful for prices or numbers next to units.",
      "Test with both text that should match and text that should not.",
    ],
    extraFaqs: [
      {
        question: "What regex flavour does it produce?",
        answer: "JavaScript's. Most of it works unchanged in other languages; the export panel rewrites named groups, quoting and flags for each language and lists the features that differ, such as look-behind in Go and Rust.",
      },
      {
        question: "Can it read an existing regular expression back into blocks?",
        answer: "No. The builder creates expressions from blocks. To understand an existing one, paste it into the Regex Tester, which explains every part in plain English.",
      },
      {
        question: "Is my test text kept?",
        answer: "No. It stays in your browser. Nothing is sent or saved, apart from the flags you last chose.",
      },
    ],
  },
};
