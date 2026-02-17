-- ============================================================================
-- Migration: 00001_initial_schema.sql
-- Description: Initial database schema for SaaS SAV IA
-- Multi-tenant architecture with org_id isolation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'agent');
CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_channel AS ENUM ('email', 'form', 'google_review', 'manual');
CREATE TYPE sender_type AS ENUM ('customer', 'agent', 'ai');

-- ----------------------------------------------------------------------------
-- TABLE: organizations
-- Les entreprises clientes du SaaS. Chaque organisation est un tenant isolé.
-- ----------------------------------------------------------------------------

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizations IS 'Entreprises clientes du SaaS. Chaque org est un tenant isolé.';

-- ----------------------------------------------------------------------------
-- TABLE: profiles
-- Les utilisateurs (agents SAV). Liés à auth.users de Supabase.
-- Le id correspond au id de auth.users.
-- ----------------------------------------------------------------------------

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name text,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);

COMMENT ON TABLE profiles IS 'Utilisateurs (agents SAV). Référence auth.users via id.';

-- ----------------------------------------------------------------------------
-- TABLE: customers
-- Les clients finaux qui envoient des demandes SAV.
-- Un même email ne peut exister qu'une fois par organisation.
-- ----------------------------------------------------------------------------

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_customers_org_email UNIQUE (organization_id, email)
);

CREATE INDEX idx_customers_organization_id ON customers(organization_id);

COMMENT ON TABLE customers IS 'Clients finaux qui contactent le SAV. Unique par (org, email).';

-- ----------------------------------------------------------------------------
-- TABLE: tickets
-- Les demandes SAV. Chaque ticket appartient à une organisation,
-- est lié à un customer, et peut être assigné à un agent (profile).
-- ----------------------------------------------------------------------------

CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  channel ticket_channel NOT NULL DEFAULT 'email',
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_organization_id ON tickets(organization_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_org_status ON tickets(organization_id, status);

COMMENT ON TABLE tickets IS 'Demandes SAV. Isolées par org, liées à un customer et optionnellement un agent.';

-- ----------------------------------------------------------------------------
-- TABLE: messages
-- Les messages dans chaque ticket (conversation).
-- sender_type indique si c'est le customer, un agent, ou l'IA.
-- sender_id pointe vers profiles.id (agent) ou customers.id selon sender_type.
-- ----------------------------------------------------------------------------

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type sender_type NOT NULL,
  sender_id uuid,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);

COMMENT ON TABLE messages IS 'Messages dans un ticket. sender_type distingue customer/agent/ai.';

-- ----------------------------------------------------------------------------
-- TABLE: tags
-- Tags pour catégoriser les tickets. Chaque tag appartient à une organisation.
-- ----------------------------------------------------------------------------

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_tags_org_name UNIQUE (organization_id, name)
);

CREATE INDEX idx_tags_organization_id ON tags(organization_id);

COMMENT ON TABLE tags IS 'Tags de catégorisation des tickets. Uniques par (org, name).';

-- ----------------------------------------------------------------------------
-- TABLE: ticket_tags
-- Relation many-to-many entre tickets et tags.
-- ----------------------------------------------------------------------------

CREATE TABLE ticket_tags (
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (ticket_id, tag_id)
);

CREATE INDEX idx_ticket_tags_tag_id ON ticket_tags(tag_id);

COMMENT ON TABLE ticket_tags IS 'Relation N:N entre tickets et tags.';

-- ----------------------------------------------------------------------------
-- UPDATED_AT TRIGGER
-- Met à jour automatiquement updated_at lors d'un UPDATE.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Activé sur toutes les tables. Les policies seront ajoutées après l'auth.
-- ----------------------------------------------------------------------------

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;
