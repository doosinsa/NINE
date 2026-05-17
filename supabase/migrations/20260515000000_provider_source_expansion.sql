alter table eps_estimates
  drop constraint if exists eps_estimates_data_source_check;

alter table eps_estimates
  add constraint eps_estimates_data_source_check
  check (data_source in ('naver', 'hankyung', 'finnhub', 'fnguide', 'alpha-vantage'));

alter table earnings
  add column if not exists data_source text;

update earnings
set data_source = case
  when ticker like '%.%' then 'dart'
  else 'yahoo-finance'
end
where data_source is null;

alter table earnings
  alter column data_source set not null;

alter table earnings
  add constraint earnings_data_source_check
  check (data_source in ('dart', 'yahoo-finance', 'alpha-vantage', 'sec-edgar'));
