/**
 * DEMO MODE — Mock data used as placeholder until Supabase integration is complete.
 *
 * TODO: Remove this file and all DEMO_MODE usages once real data fetching is implemented.
 * Files using mock data are marked with // DEMO_MODE comments.
 */

import type { Customer, Message, Ticket } from '@/types/database.types'
import type { TicketWithRelations } from '@/types/view-models'

const MOCK_ORG_ID = 'mock-org-id'
const MOCK_AGENT_ID = 'mock-agent-id'

function createCustomer(id: string, fullName: string, email: string): Customer {
  const createdAt = '2026-02-01T09:00:00Z'

  return {
    id,
    organization_id: MOCK_ORG_ID,
    email,
    full_name: fullName,
    phone: null,
    metadata: null,
    health_score: 100,
    segment: 'standard',
    total_spent: 0,
    notes: null,
    tags: [],
    last_satisfaction_score: null,
    first_contact_at: null,
    lifetime_tickets: 1,
    created_at: createdAt,
    updated_at: createdAt,
  }
}

function createMessage(
  ticketId: string,
  id: string,
  senderType: Message['sender_type'],
  body: string,
  createdAt: string
): Message {
  return {
    id,
    ticket_id: ticketId,
    sender_type: senderType,
    sender_id: null,
    body,
    metadata: null,
    created_at: createdAt,
  }
}

function createTicketBase(
  id: string,
  customerId: string,
  subject: string,
  status: Ticket['status'],
  priority: Ticket['priority'],
  channel: Ticket['channel'],
  createdAt: string,
  assignedTo: string | null,
  csatRating: number | null = null
): Ticket {
  return {
    id,
    organization_id: MOCK_ORG_ID,
    customer_id: customerId,
    assigned_to: assignedTo,
    subject,
    status,
    priority,
    channel,
    metadata: null,
    ai_summary: null,
    csat_rating: csatRating,
    csat_comment: null,
    csat_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  }
}

function buildTicket(
  ticket: Ticket,
  customer: Customer,
  tags: string[],
  messages: Message[]
): TicketWithRelations {
  const sortedMessages = messages
    .slice()
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    )

  const latestMessage = sortedMessages[sortedMessages.length - 1] ?? null

  return {
    ...ticket,
    customer,
    messages: sortedMessages,
    unread:
      ticket.status === 'open' && latestMessage?.sender_type === 'customer',
    last_message_preview: latestMessage?.body.slice(0, 120) ?? null,
    last_message_at: latestMessage?.created_at ?? null,
    last_message_sender_type: latestMessage?.sender_type ?? null,
    tags,
  }
}

const customers = {
  jean: createCustomer('c1', 'Jean Dupont', 'jean.dupont@gmail.com'),
  marie: createCustomer('c2', 'Marie Lambert', 'marie.lambert@outlook.fr'),
  lucas: createCustomer('c3', 'Lucas Martin', 'lucas.martin@yahoo.fr'),
  sophie: createCustomer('c4', 'Sophie Petit', 'sophie.petit@hotmail.com'),
  pierre: createCustomer('c5', 'Pierre Bernard', 'p.bernard@entreprise.fr'),
  emma: createCustomer('c6', 'Emma Wilson', 'emma.w@gmail.com'),
  thomas: createCustomer('c7', 'Thomas Dubois', 'thomas.dubois@free.fr'),
  camille: createCustomer('c8', 'Camille Roux', 'camille.roux@gmail.com'),
} as const

export const mockTickets: TicketWithRelations[] = [
  buildTicket(
    createTicketBase(
      't1',
      customers.jean.id,
      'Remboursement commande #4521',
      'open',
      'urgent',
      'email',
      '2026-02-08T14:25:00Z',
      null
    ),
    customers.jean,
    ['Remboursement', 'Urgent'],
    [
      createMessage(
        't1',
        'm1',
        'customer',
        'Bonjour,\n\nJe souhaite être remboursé pour ma commande #4521. Le produit ne correspond absolument pas à la description sur votre site. La couleur est différente et la taille est incorrecte.\n\nJe demande un remboursement intégral sous 48h sinon je contacterai ma banque pour une opposition.\n\nCordialement,\nJean Dupont',
        '2026-02-08T14:25:00Z'
      ),
      createMessage(
        't1',
        'm2',
        'agent',
        "Bonjour Jean,\n\nJe comprends votre frustration et je suis désolé pour cette erreur. Pourriez-vous m'envoyer une photo du produit reçu afin que je puisse vérifier avec notre entrepôt ?\n\nNous traiterons votre demande en priorité.\n\nCordialement,\nNathaniel",
        '2026-02-08T14:30:00Z'
      ),
      createMessage(
        't1',
        'm3',
        'customer',
        "Voici les photos en pièce jointe. Comme vous pouvez le constater, le produit est bleu alors que j'avais commandé noir. C'est inacceptable.",
        '2026-02-08T14:35:00Z'
      ),
    ]
  ),
  buildTicket(
    createTicketBase(
      't2',
      customers.marie.id,
      'Produit reçu endommagé',
      'open',
      'high',
      'email',
      '2026-02-08T13:45:00Z',
      MOCK_AGENT_ID
    ),
    customers.marie,
    ['Produit', 'SAV'],
    [
      createMessage(
        't2',
        'm4',
        'customer',
        "Bonjour,\n\nJ'ai reçu ma commande ce matin mais le colis était visiblement abîmé. En ouvrant, j'ai constaté que le produit est cassé — l'écran est fissuré sur toute la longueur.\n\nJ'ai pris des photos de l'emballage et du produit. Que dois-je faire ?",
        '2026-02-08T13:45:00Z'
      ),
      createMessage(
        't2',
        'm5',
        'customer',
        "J'ajoute que c'était un cadeau d'anniversaire pour demain... J'ai vraiment besoin d'une solution rapide. Merci.",
        '2026-02-08T13:50:00Z'
      ),
    ]
  ),
  buildTicket(
    createTicketBase(
      't3',
      customers.lucas.id,
      'Avis Google — Service client lent',
      'pending',
      'medium',
      'google_review',
      '2026-02-08T11:00:00Z',
      MOCK_AGENT_ID
    ),
    customers.lucas,
    ['Avis Google'],
    [
      createMessage(
        't3',
        'm6',
        'customer',
        "⭐⭐ (2/5)\n\nService client très lent. J'ai attendu 5 jours pour une réponse à mon email. Le produit en lui-même est correct mais le SAV laisse vraiment à désirer. Je ne recommande pas pour le moment.",
        '2026-02-08T11:00:00Z'
      ),
      createMessage(
        't3',
        'm7',
        'ai',
        "Bonjour Lucas,\n\nMerci d'avoir pris le temps de nous laisser votre avis. Nous sommes sincèrement désolés pour ce délai de réponse qui ne reflète pas nos standards habituels.\n\nNous avons depuis renforcé notre équipe SAV et mis en place de nouveaux outils pour garantir une réponse sous 24h. Nous serions ravis de vous prouver notre amélioration — n'hésitez pas à nous contacter directement.\n\nL'équipe SAV",
        '2026-02-08T11:15:00Z'
      ),
    ]
  ),
  buildTicket(
    createTicketBase(
      't4',
      customers.sophie.id,
      'Délai de livraison commande #7892',
      'open',
      'low',
      'form',
      '2026-02-08T09:30:00Z',
      null
    ),
    customers.sophie,
    ['Livraison'],
    [
      createMessage(
        't4',
        'm8',
        'customer',
        "Bonjour,\n\nJ'ai passé une commande il y a 4 jours (commande #7892) et je n'ai toujours pas reçu de numéro de suivi. Pouvez-vous me dire quand je recevrai mon colis ?\n\nMerci,\nSophie",
        '2026-02-08T09:30:00Z'
      ),
    ]
  ),
  buildTicket(
    createTicketBase(
      't5',
      customers.pierre.id,
      'Demande de facture',
      'resolved',
      'low',
      'email',
      '2026-02-07T16:00:00Z',
      MOCK_AGENT_ID
    ),
    customers.pierre,
    ['Facturation'],
    [
      createMessage(
        't5',
        'm9',
        'customer',
        "Bonjour,\n\nPourriez-vous m'envoyer la facture pour la commande #3456 ? J'en ai besoin pour ma comptabilité.\n\nCordialement,\nPierre Bernard",
        '2026-02-07T16:00:00Z'
      ),
      createMessage(
        't5',
        'm10',
        'agent',
        "Bonjour Pierre,\n\nBien sûr ! Vous trouverez la facture en pièce jointe.\n\nN'hésitez pas si vous avez besoin d'autre chose.\n\nCordialement,\nNathaniel",
        '2026-02-07T16:30:00Z'
      ),
      createMessage(
        't5',
        'm11',
        'customer',
        'Parfait, merci beaucoup pour la rapidité !',
        '2026-02-07T16:35:00Z'
      ),
      createMessage(
        't5',
        'm12',
        'agent',
        'Avec plaisir ! Je clos ce ticket. Bonne journée.',
        '2026-02-07T16:40:00Z'
      ),
    ]
  ),
  buildTicket(
    createTicketBase(
      't6',
      customers.emma.id,
      'Bug application mobile — paiement impossible',
      'open',
      'high',
      'form',
      '2026-02-08T13:00:00Z',
      null
    ),
    customers.emma,
    ['Bug', 'Urgent'],
    [
      createMessage(
        't6',
        'm13',
        'customer',
        `Bonjour,\n\nImpossible de finaliser mon paiement sur l'app mobile (iPhone 15, iOS 18.3). Quand j'appuie sur "Payer", l'écran devient blanc pendant 3 secondes puis revient au panier. J'ai essayé 4 fois.\n\nMon panier contient 3 articles pour un total de 127€.`,
        '2026-02-08T13:00:00Z'
      ),
      createMessage(
        't6',
        'm14',
        'customer',
        "Mise à jour : j'ai essayé avec Safari sur le même téléphone et ça fonctionne. Le problème vient bien de l'application.",
        '2026-02-08T13:15:00Z'
      ),
    ]
  ),
  buildTicket(
    createTicketBase(
      't7',
      customers.thomas.id,
      'Changement adresse de livraison',
      'pending',
      'medium',
      'email',
      '2026-02-06T10:00:00Z',
      MOCK_AGENT_ID
    ),
    customers.thomas,
    ['Livraison'],
    [
      createMessage(
        't7',
        'm15',
        'customer',
        'Bonjour,\n\nJe viens de déménager et j\'ai une commande en cours (#6234). Est-il possible de changer l\'adresse de livraison ?\n\nNouvelle adresse :\n15 rue des Lilas\n75011 Paris\n\nMerci,\nThomas',
        '2026-02-06T10:00:00Z'
      ),
      createMessage(
        't7',
        'm16',
        'agent',
        "Bonjour Thomas,\n\nJ'ai bien noté votre nouvelle adresse. Je fais la modification auprès de notre transporteur. Vous recevrez un email de confirmation avec le nouveau suivi.\n\nCordialement,\nNathaniel",
        '2026-02-06T11:00:00Z'
      ),
      createMessage(
        't7',
        'm17',
        'customer',
        "Super, merci beaucoup pour la réactivité ! J'attends l'email de confirmation.",
        '2026-02-06T11:10:00Z'
      ),
    ]
  ),
  buildTicket(
    createTicketBase(
      't8',
      customers.camille.id,
      'Retour produit — Article non conforme',
      'open',
      'urgent',
      'email',
      '2026-02-08T14:15:00Z',
      null
    ),
    customers.camille,
    ['Retour', 'Urgent'],
    [
      createMessage(
        't8',
        'm18',
        'customer',
        `Bonjour,\n\nLe produit reçu ne correspond pas du tout à ce que j'ai commandé. J'ai commandé un modèle "Premium" et j'ai reçu le modèle "Standard". La différence de prix est de 89€.\n\nJe souhaite retourner le produit et recevoir le bon modèle en échange. Merci de m'envoyer une étiquette de retour.`,
        '2026-02-08T14:15:00Z'
      ),
      createMessage(
        't8',
        'm19',
        'customer',
        `J'ai vérifié le bon de livraison et il indique bien "Premium". C'est une erreur de votre entrepôt.`,
        '2026-02-08T14:20:00Z'
      ),
    ]
  ),
]
