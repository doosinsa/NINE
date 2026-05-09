create extension if not exists pgcrypto;

create type country_code as enum ('KR', 'US');
create type stock_source as enum ('core_universe', 'discover', 'search');
create type score_decision as enum ('buy', 'watch', 'pass');
create type quarterly_action as enum ('hold', 'reduce_50', 'sell_all');
create type alert_tier as enum ('tier_1', 'tier_2', 'tier_3');

create table stocks (
  ticker text primary key,
  name text not null,
  country country_code not null,
  sector text,
  market_cap numeric,
  is_holding boolean not null default false,
  source stock_source not null default 'core_universe',
  created_at timestamptz not null default now()
);

create table prices (
  ticker text not null references stocks(ticker) on delete cascade,
  price_date date not null,
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  volume numeric,
  data_source text not null,
  created_at timestamptz not null default now(),
  primary key (ticker, price_date)
);

create table eps_estimates (
  ticker text not null references stocks(ticker) on delete cascade,
  snapshot_date date not null,
  fy_year int not null,
  consensus numeric not null,
  analyst_count int,
  data_source text not null check (data_source in ('naver', 'hankyung', 'finnhub', 'fnguide')),
  created_at timestamptz not null default now(),
  primary key (ticker, snapshot_date, fy_year)
);

create table earnings (
  ticker text not null references stocks(ticker) on delete cascade,
  fiscal_quarter text not null,
  revenue numeric,
  revenue_yoy numeric,
  eps numeric,
  eps_surprise numeric,
  reported_at date,
  created_at timestamptz not null default now(),
  primary key (ticker, fiscal_quarter)
);

create table llm_briefs (
  id uuid primary key default gen_random_uuid(),
  ticker text not null references stocks(ticker) on delete cascade,
  generated_at timestamptz not null default now(),
  structural_demand text not null,
  supply_constraint text not null,
  eps_revision_driver text not null,
  bear_case text not null,
  narrative_warning_flag boolean not null default false,
  narrative_warning_reason text
);

create table manual_scores (
  ticker text primary key references stocks(ticker) on delete cascade,
  score_quant int not null default 0 check (score_quant between 0 and 3),
  score_demand int not null default 0 check (score_demand between 0 and 3),
  score_supply int not null default 0 check (score_supply between 0 and 3),
  total_score int generated always as (score_quant + score_demand + score_supply) stored,
  decision score_decision,
  thesis_summary text,
  thesis_kill_1 text,
  thesis_kill_2 text,
  thesis_kill_3 text,
  position_size_krw numeric,
  bought_at_price numeric,
  bought_at_date date,
  reviewed_at timestamptz not null default now(),
  constraint buy_requires_thesis_kill check (
    decision is distinct from 'buy'
    or (char_length(coalesce(thesis_kill_1, '')) between 30 and 100
      and char_length(coalesce(thesis_kill_2, '')) between 30 and 100
      and char_length(coalesce(thesis_kill_3, '')) between 30 and 100)
  )
);

create table manual_score_history (
  id bigserial primary key,
  ticker text not null references stocks(ticker) on delete cascade,
  score_quant int not null check (score_quant between 0 and 3),
  score_demand int not null check (score_demand between 0 and 3),
  score_supply int not null check (score_supply between 0 and 3),
  decision score_decision,
  changed_at timestamptz not null default now()
);

create table weekly_score_snapshots (
  ticker text not null references stocks(ticker) on delete cascade,
  week_of date not null,
  score_quant int not null check (score_quant between 0 and 3),
  total_score int not null check (total_score between 0 and 9),
  score_change int,
  is_new_seven_plus boolean not null default false,
  generated_at timestamptz not null default now(),
  primary key (ticker, week_of)
);

create table quarterly_reviews (
  id bigserial primary key,
  ticker text not null references stocks(ticker) on delete cascade,
  review_date date not null default current_date,
  thesis_still_valid boolean not null,
  kill_conditions_triggered int not null check (kill_conditions_triggered between 0 and 3),
  notes text,
  action quarterly_action not null,
  created_at timestamptz not null default now()
);

create table discover_themes (
  id bigserial primary key,
  week_of date not null,
  theme_name text not null,
  news_frequency_change numeric not null,
  export_signal_change numeric,
  capex_signal text,
  representative_tickers text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table api_costs (
  date date primary key,
  claude_haiku_input_tokens int not null default 0,
  claude_haiku_output_tokens int not null default 0,
  estimated_cost_usd numeric not null default 0,
  stopped_at timestamptz
);

create table daily_search_log (
  date date not null default current_date,
  ticker text not null,
  is_universe_outside boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (date, ticker)
);

create table notification_events (
  id bigserial primary key,
  tier alert_tier not null,
  ticker text references stocks(ticker) on delete set null,
  message text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index prices_ticker_date_desc_idx on prices (ticker, price_date desc);
create index eps_estimates_ticker_snapshot_desc_idx on eps_estimates (ticker, snapshot_date desc);
create index earnings_ticker_reported_desc_idx on earnings (ticker, reported_at desc);
create index llm_briefs_ticker_generated_desc_idx on llm_briefs (ticker, generated_at desc);
create index manual_scores_total_score_idx on manual_scores (total_score desc);
create index weekly_score_snapshots_week_score_idx on weekly_score_snapshots (week_of desc, total_score desc);
create index discover_themes_week_idx on discover_themes (week_of desc);
create index notification_events_tier_created_idx on notification_events (tier, created_at desc);

create or replace function compute_quant_score(p_ticker text, p_as_of date default current_date)
returns int
language sql
stable
as $$
  with latest as (
    select consensus
    from eps_estimates
    where ticker = p_ticker and snapshot_date <= p_as_of
    order by snapshot_date desc
    limit 1
  ),
  prior as (
    select consensus
    from eps_estimates
    where ticker = p_ticker and snapshot_date <= p_as_of - interval '3 months'
    order by snapshot_date desc
    limit 1
  ),
  surprise as (
    select coalesce(avg(eps_surprise), 0) as avg_surprise
    from (
      select eps_surprise
      from earnings
      where ticker = p_ticker and eps_surprise is not null
      order by reported_at desc nulls last
      limit 4
    ) recent
  )
  select least(
    3,
    case
      when prior.consensus is null or prior.consensus = 0 or latest.consensus is null then 0
      when (latest.consensus / prior.consensus) - 1 >= 0.10 then 3
      when (latest.consensus / prior.consensus) - 1 >= 0.05 then 2
      when (latest.consensus / prior.consensus) - 1 >= 0 then 1
      else 0
    end
    + case when surprise.avg_surprise > 0.05 then 1 else 0 end
  )
  from latest
  full join prior on true
  cross join surprise;
$$;

create or replace view latest_llm_briefs as
select distinct on (ticker)
  *
from llm_briefs
order by ticker, generated_at desc;

create or replace view weekly_candidates as
select
  s.ticker,
  s.name,
  s.country,
  s.sector,
  s.market_cap,
  s.is_holding,
  s.source,
  ms.score_quant,
  ms.score_demand,
  ms.score_supply,
  ms.total_score,
  ms.decision,
  wss.week_of,
  wss.score_change,
  wss.is_new_seven_plus,
  lb.generated_at as brief_generated_at
from stocks s
join manual_scores ms on ms.ticker = s.ticker
left join weekly_score_snapshots wss on wss.ticker = s.ticker
left join latest_llm_briefs lb on lb.ticker = s.ticker
where ms.total_score >= 4
order by ms.total_score desc, wss.is_new_seven_plus desc nulls last, s.ticker;

alter table stocks enable row level security;
alter table prices enable row level security;
alter table eps_estimates enable row level security;
alter table earnings enable row level security;
alter table llm_briefs enable row level security;
alter table manual_scores enable row level security;
alter table manual_score_history enable row level security;
alter table weekly_score_snapshots enable row level security;
alter table quarterly_reviews enable row level security;
alter table discover_themes enable row level security;
alter table api_costs enable row level security;
alter table daily_search_log enable row level security;
alter table notification_events enable row level security;
