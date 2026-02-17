// Mock data for dashboard UI — will be replaced by real Supabase queries

export type MockCustomer = {
  id: string
  name: string
  email: string
}

export type MockMessage = {
  id: string
  senderType: 'customer' | 'agent' | 'ai'
  senderName: string
  body: string
  createdAt: string
}

export type MockTicket = {
  id: string
  subject: string
  customer: MockCustomer
  customerMetadata: Record<string, unknown> | null
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  channel: 'email' | 'form' | 'google_review' | 'manual' | 'instagram' | 'messenger'
  assignedTo: string | null
  assignedToId: string | null
  unread: boolean
  tags: string[]
  csatRating: number | null
  createdAt: string
  messages: MockMessage[]
}

// ── Customers ───────────────────────────────────────────────────────────────

const customers = {
  jean: { id: 'c1', name: 'Jean Dupont', email: 'jean.dupont@gmail.com' },
  marie: { id: 'c2', name: 'Marie Lambert', email: 'marie.lambert@outlook.fr' },
  lucas: { id: 'c3', name: 'Lucas Martin', email: 'lucas.martin@yahoo.fr' },
  sophie: { id: 'c4', name: 'Sophie Petit', email: 'sophie.petit@hotmail.com' },
  pierre: { id: 'c5', name: 'Pierre Bernard', email: 'p.bernard@entreprise.fr' },
  emma: { id: 'c6', name: 'Emma Wilson', email: 'emma.w@gmail.com' },
  thomas: { id: 'c7', name: 'Thomas Dubois', email: 'thomas.dubois@free.fr' },
  camille: { id: 'c8', name: 'Camille Roux', email: 'camille.roux@gmail.com' },
}

// ── Tickets ─────────────────────────────────────────────────────────────────

export const mockTickets: MockTicket[] = [
  {
    id: 't1',
    subject: 'Remboursement commande #4521',
    customer: customers.jean,
    status: 'open',
    priority: 'urgent',
    channel: 'email',
    assignedTo: null,
    assignedToId: null,
    unread: true,
    tags: ['Remboursement', 'Urgent'],
    createdAt: '2026-02-08T14:25:00Z',
    customerMetadata: null,
    csatRating: null,
    messages: [
      {
        id: 'm1',
        senderType: 'customer',
        senderName: 'Jean Dupont',
        body: 'Bonjour,\n\nJe souhaite être remboursé pour ma commande #4521. Le produit ne correspond absolument pas à la description sur votre site. La couleur est différente et la taille est incorrecte.\n\nJe demande un remboursement intégral sous 48h sinon je contacterai ma banque pour une opposition.\n\nCordialement,\nJean Dupont',
        createdAt: '2026-02-08T14:25:00Z',
      },
      {
        id: 'm2',
        senderType: 'agent',
        senderName: 'Nathaniel B.',
        body: 'Bonjour Jean,\n\nJe comprends votre frustration et je suis désolé pour cette erreur. Pourriez-vous m\'envoyer une photo du produit reçu afin que je puisse vérifier avec notre entrepôt ?\n\nNous traiterons votre demande en priorité.\n\nCordialement,\nNathaniel',
        createdAt: '2026-02-08T14:30:00Z',
      },
      {
        id: 'm3',
        senderType: 'customer',
        senderName: 'Jean Dupont',
        body: 'Voici les photos en pièce jointe. Comme vous pouvez le constater, le produit est bleu alors que j\'avais commandé noir. C\'est inacceptable.',
        createdAt: '2026-02-08T14:35:00Z',
      },
    ],
  },
  {
    id: 't2',
    subject: 'Produit reçu endommagé',
    customer: customers.marie,
    status: 'open',
    priority: 'high',
    channel: 'email',
    assignedTo: 'Nathaniel B.',
    assignedToId: 'mock-agent-id',
    unread: true,
    tags: ['Produit', 'SAV'],
    createdAt: '2026-02-08T13:45:00Z',
    customerMetadata: null,
    csatRating: null,
    messages: [
      {
        id: 'm4',
        senderType: 'customer',
        senderName: 'Marie Lambert',
        body: 'Bonjour,\n\nJ\'ai reçu ma commande ce matin mais le colis était visiblement abîmé. En ouvrant, j\'ai constaté que le produit est cassé — l\'écran est fissuré sur toute la longueur.\n\nJ\'ai pris des photos de l\'emballage et du produit. Que dois-je faire ?',
        createdAt: '2026-02-08T13:45:00Z',
      },
      {
        id: 'm5',
        senderType: 'customer',
        senderName: 'Marie Lambert',
        body: 'J\'ajoute que c\'était un cadeau d\'anniversaire pour demain... J\'ai vraiment besoin d\'une solution rapide. Merci.',
        createdAt: '2026-02-08T13:50:00Z',
      },
    ],
  },
  {
    id: 't3',
    subject: 'Avis Google — Service client lent',
    customer: customers.lucas,
    status: 'pending',
    priority: 'medium',
    channel: 'google_review',
    assignedTo: 'Nathaniel B.',
    assignedToId: 'mock-agent-id',
    unread: false,
    tags: ['Avis Google'],
    createdAt: '2026-02-08T11:00:00Z',
    customerMetadata: null,
    csatRating: null,
    messages: [
      {
        id: 'm6',
        senderType: 'customer',
        senderName: 'Lucas Martin',
        body: '⭐⭐ (2/5)\n\nService client très lent. J\'ai attendu 5 jours pour une réponse à mon email. Le produit en lui-même est correct mais le SAV laisse vraiment à désirer. Je ne recommande pas pour le moment.',
        createdAt: '2026-02-08T11:00:00Z',
      },
      {
        id: 'm7',
        senderType: 'ai',
        senderName: 'SAV IA',
        body: 'Bonjour Lucas,\n\nMerci d\'avoir pris le temps de nous laisser votre avis. Nous sommes sincèrement désolés pour ce délai de réponse qui ne reflète pas nos standards habituels.\n\nNous avons depuis renforcé notre équipe SAV et mis en place de nouveaux outils pour garantir une réponse sous 24h. Nous serions ravis de vous prouver notre amélioration — n\'hésitez pas à nous contacter directement.\n\nL\'équipe SAV',
        createdAt: '2026-02-08T11:15:00Z',
      },
    ],
  },
  {
    id: 't4',
    subject: 'Délai de livraison commande #7892',
    customer: customers.sophie,
    status: 'open',
    priority: 'low',
    channel: 'form',
    assignedTo: null,
    assignedToId: null,
    unread: true,
    tags: ['Livraison'],
    createdAt: '2026-02-08T09:30:00Z',
    customerMetadata: null,
    csatRating: null,
    messages: [
      {
        id: 'm8',
        senderType: 'customer',
        senderName: 'Sophie Petit',
        body: 'Bonjour,\n\nJ\'ai passé une commande il y a 4 jours (commande #7892) et je n\'ai toujours pas reçu de numéro de suivi. Pouvez-vous me dire quand je recevrai mon colis ?\n\nMerci,\nSophie',
        createdAt: '2026-02-08T09:30:00Z',
      },
    ],
  },
  {
    id: 't5',
    subject: 'Demande de facture',
    customer: customers.pierre,
    status: 'resolved',
    priority: 'low',
    channel: 'email',
    assignedTo: 'Nathaniel B.',
    assignedToId: 'mock-agent-id',
    unread: false,
    tags: ['Facturation'],
    createdAt: '2026-02-07T16:00:00Z',
    customerMetadata: null,
    csatRating: null,
    messages: [
      {
        id: 'm9',
        senderType: 'customer',
        senderName: 'Pierre Bernard',
        body: 'Bonjour,\n\nPourriez-vous m\'envoyer la facture pour la commande #3456 ? J\'en ai besoin pour ma comptabilité.\n\nCordialement,\nPierre Bernard',
        createdAt: '2026-02-07T16:00:00Z',
      },
      {
        id: 'm10',
        senderType: 'agent',
        senderName: 'Nathaniel B.',
        body: 'Bonjour Pierre,\n\nBien sûr ! Vous trouverez la facture en pièce jointe.\n\nN\'hésitez pas si vous avez besoin d\'autre chose.\n\nCordialement,\nNathaniel',
        createdAt: '2026-02-07T16:30:00Z',
      },
      {
        id: 'm11',
        senderType: 'customer',
        senderName: 'Pierre Bernard',
        body: 'Parfait, merci beaucoup pour la rapidité !',
        createdAt: '2026-02-07T16:35:00Z',
      },
      {
        id: 'm12',
        senderType: 'agent',
        senderName: 'Nathaniel B.',
        body: 'Avec plaisir ! Je clos ce ticket. Bonne journée.',
        createdAt: '2026-02-07T16:40:00Z',
      },
    ],
  },
  {
    id: 't6',
    subject: 'Bug application mobile — paiement impossible',
    customer: customers.emma,
    status: 'open',
    priority: 'high',
    channel: 'form',
    assignedTo: null,
    assignedToId: null,
    unread: true,
    tags: ['Bug', 'Urgent'],
    createdAt: '2026-02-08T13:00:00Z',
    customerMetadata: null,
    csatRating: null,
    messages: [
      {
        id: 'm13',
        senderType: 'customer',
        senderName: 'Emma Wilson',
        body: 'Bonjour,\n\nImpossible de finaliser mon paiement sur l\'app mobile (iPhone 15, iOS 18.3). Quand j\'appuie sur "Payer", l\'écran devient blanc pendant 3 secondes puis revient au panier. J\'ai essayé 4 fois.\n\nMon panier contient 3 articles pour un total de 127€.',
        createdAt: '2026-02-08T13:00:00Z',
      },
      {
        id: 'm14',
        senderType: 'customer',
        senderName: 'Emma Wilson',
        body: 'Mise à jour : j\'ai essayé avec Safari sur le même téléphone et ça fonctionne. Le problème vient bien de l\'application.',
        createdAt: '2026-02-08T13:15:00Z',
      },
    ],
  },
  {
    id: 't7',
    subject: 'Changement adresse de livraison',
    customer: customers.thomas,
    status: 'pending',
    priority: 'medium',
    channel: 'email',
    assignedTo: 'Nathaniel B.',
    assignedToId: 'mock-agent-id',
    unread: false,
    tags: ['Livraison'],
    createdAt: '2026-02-06T10:00:00Z',
    customerMetadata: null,
    csatRating: null,
    messages: [
      {
        id: 'm15',
        senderType: 'customer',
        senderName: 'Thomas Dubois',
        body: 'Bonjour,\n\nJe viens de déménager et j\'ai une commande en cours (#6234). Est-il possible de changer l\'adresse de livraison ?\n\nNouvelle adresse :\n15 rue des Lilas\n75011 Paris\n\nMerci,\nThomas',
        createdAt: '2026-02-06T10:00:00Z',
      },
      {
        id: 'm16',
        senderType: 'agent',
        senderName: 'Nathaniel B.',
        body: 'Bonjour Thomas,\n\nJ\'ai bien noté votre nouvelle adresse. Je fais la modification auprès de notre transporteur. Vous recevrez un email de confirmation avec le nouveau suivi.\n\nCordialement,\nNathaniel',
        createdAt: '2026-02-06T11:00:00Z',
      },
      {
        id: 'm17',
        senderType: 'customer',
        senderName: 'Thomas Dubois',
        body: 'Super, merci beaucoup pour la réactivité ! J\'attends l\'email de confirmation.',
        createdAt: '2026-02-06T11:10:00Z',
      },
    ],
  },
  {
    id: 't8',
    subject: 'Retour produit — Article non conforme',
    customer: customers.camille,
    status: 'open',
    priority: 'urgent',
    channel: 'email',
    assignedTo: null,
    assignedToId: null,
    unread: true,
    tags: ['Retour', 'Urgent'],
    createdAt: '2026-02-08T14:15:00Z',
    customerMetadata: null,
    csatRating: null,
    messages: [
      {
        id: 'm18',
        senderType: 'customer',
        senderName: 'Camille Roux',
        body: 'Bonjour,\n\nLe produit reçu ne correspond pas du tout à ce que j\'ai commandé. J\'ai commandé un modèle "Premium" et j\'ai reçu le modèle "Standard". La différence de prix est de 89€.\n\nJe souhaite retourner le produit et recevoir le bon modèle en échange. Merci de m\'envoyer une étiquette de retour.',
        createdAt: '2026-02-08T14:15:00Z',
      },
      {
        id: 'm19',
        senderType: 'customer',
        senderName: 'Camille Roux',
        body: 'J\'ai vérifié le bon de livraison et il indique bien "Premium". C\'est une erreur de votre entrepôt.',
        createdAt: '2026-02-08T14:20:00Z',
      },
    ],
  },
]
