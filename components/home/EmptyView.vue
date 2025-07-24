<template>
  <div class="px-8 font-text grid grid-cols-1 md:grid-cols-4 gap-8">
    <div 
      v-for="quote in sampleQuotes" 
      :key="quote.id" 
      class="col-span-1 md:col-span-2 lg:col-span-1 group hover:shadow-sm transition-shadow duration-200"
    >
      <h4 class="font-body border-b-1 b-dashed border-black mb-2">
        {{ quote.author }} — {{ quote.reference }}
      </h4>
      <h3 class="text-gray-800 dark:text-gray-200 leading-relaxed">
        {{ quote.text }}
      </h3>
    </div>
  </div>
</template>

<script setup>
// Sample quotes with diverse authors and content
const sampleQuotes = [
  {
    id: 1,
    author: "Albert Einstein",
    reference: "Book 1",
    text: "Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world, stimulating progress, giving birth to evolution."
  },
  {
    id: 2,
    author: "Yoda",
    reference: "Star Wars",
    text: "Do or do not, there is no try."
  },
  {
    id: 3,
    author: "Maya Angelou",
    reference: "I Know Why the Caged Bird Sings",
    text: "There is no greater agony than bearing an untold story inside you."
  },
  {
    id: 4,
    author: "Nelson Mandela",
    reference: "Anti-Apartheid Revolutionary",
    text: "Education is the most powerful weapon which you can use to change the world."
  },
  {
    id: 5,
    author: "Marie Curie",
    reference: "Book 2",
    text: "Nothing in life is to be feared, it is only to be understood."
  },
  {
    id: 6,
    author: "Oscar Wilde",
    reference: "Playwright & Poet",
    text: "Be yourself; everyone else is already taken."
  },
  {
    id: 7,
    author: "Frida Kahlo",
    reference: "Artist",
    text: "I paint my own reality. The only thing I know is that I paint because I need to."
  },
  {
    id: 8,
    author: "Martin Luther King Jr.",
    reference: "Civil Rights Leader",
    text: "Darkness cannot drive out darkness; only light can do that."
  },
  {
    id: 9,
    author: "Jane Austen",
    reference: "Novelist",
    text: "The person, be it gentleman or lady, who has not pleasure in a good novel, must be intolerably stupid."
  },
  {
    id: 10,
    author: "Leonardo da Vinci",
    reference: "Renaissance Polymath",
    text: "Learning never exhausts the mind."
  },
  {
    id: 11,
    author: "Toni Morrison",
    reference: "Novelist & Nobel Laureate",
    text: "If you want to fly, you have to give up the things that weigh you down."
  },
  {
    id: 12,
    author: "Gandhi",
    reference: "Independence Leader",
    text: "Be the change that you wish to see in the world."
  }
]
</script>
