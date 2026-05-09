insert into stocks (ticker, name, country, sector, market_cap, is_holding, source)
values
  ('005930.KS', 'Samsung Electronics', 'KR', 'Semiconductors', 420000000000000, true, 'core_universe'),
  ('PLTR', 'Palantir Technologies', 'US', 'Software', 190000000000, false, 'core_universe'),
  ('272210.KQ', 'Hanwha Systems', 'KR', 'Aerospace & Defense', 3800000000000, false, 'discover')
on conflict (ticker) do nothing;

insert into eps_estimates (ticker, snapshot_date, fy_year, consensus, analyst_count, data_source)
values
  ('005930.KS', '2026-02-01', 2026, 4800, 21, 'hankyung'),
  ('005930.KS', '2026-05-03', 2026, 5300, 22, 'hankyung'),
  ('PLTR', '2026-02-01', 2026, 0.58, 17, 'finnhub'),
  ('PLTR', '2026-05-03', 2026, 0.68, 18, 'finnhub')
on conflict (ticker, snapshot_date, fy_year) do nothing;

insert into earnings (ticker, fiscal_quarter, revenue, revenue_yoy, eps, eps_surprise, reported_at)
values
  ('005930.KS', '2026Q1', 71000000000000, 0.12, 1250, 0.06, '2026-04-30'),
  ('PLTR', '2026Q1', 980000000, 0.26, 0.16, 0.08, '2026-05-05')
on conflict (ticker, fiscal_quarter) do nothing;

insert into manual_scores (
  ticker,
  score_quant,
  score_demand,
  score_supply,
  decision,
  thesis_summary,
  thesis_kill_1,
  thesis_kill_2,
  thesis_kill_3,
  position_size_krw,
  bought_at_price,
  bought_at_date
)
values
  (
    '005930.KS',
    2,
    3,
    2,
    'buy',
    'Memory cycle recovery with disciplined supply.',
    'DRAM contract price falls for two consecutive quarters.',
    'HBM share gains stall against top competitors.',
    'Capex discipline breaks without demand confirmation.',
    10000000,
    78000,
    '2026-04-01'
  ),
  ('PLTR', 3, 3, 3, 'watch', null, null, null, null, null, null, null),
  ('272210.KQ', 2, 2, 2, 'watch', null, null, null, null, null, null, null)
on conflict (ticker) do nothing;

insert into llm_briefs (
  ticker,
  generated_at,
  structural_demand,
  supply_constraint,
  eps_revision_driver,
  bear_case,
  narrative_warning_flag,
  narrative_warning_reason
)
values
  (
    '005930.KS',
    '2026-05-09T12:00:00Z',
    'AI server memory demand supports high-end DRAM mix.',
    'Industry supply remains disciplined after prior downcycle.',
    'Consensus is moving with HBM mix and memory price recovery.',
    'Commodity memory pricing can reverse faster than narrative changes.',
    false,
    null
  ),
  (
    'PLTR',
    '2026-05-09T12:00:00Z',
    'Enterprise AI deployment demand remains broad.',
    'Deployment capacity and implementation quality are the bottlenecks.',
    'Operating leverage and government/commercial expansion support revisions.',
    'Valuation leaves little room for slower enterprise conversion.',
    true,
    'Narrative strength is high; require EPS confirmation before buy.'
  );

insert into discover_themes (
  week_of,
  theme_name,
  news_frequency_change,
  export_signal_change,
  capex_signal,
  representative_tickers
)
values
  ('2026-05-04', 'AI memory supply chain', 0.72, 0.18, 'Supplier capex commentary increased in recent earnings calls.', array['005930.KS', '000660.KS', 'MU']),
  ('2026-05-04', 'Defense electronics', 0.58, 0.11, 'Government budget commentary supports multi-year demand.', array['272210.KQ', '012450.KS', 'LMT']);
