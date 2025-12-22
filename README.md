# fed2_SP2_auctionsite

gantt
  title Auction Frontend (Static + Live Server) - 12 Day Plan
  dateFormat  YYYY-MM-DD
  axisFormat  %d %b

  section Setup
  Repo + Live Server baseline            :a1, 2025-12-22, 1d
  Tailwind + App shell                   :a2, 2025-12-23, 1d

  section Core
  Hash router + render pipeline          :b1, 2025-12-24, 1d
  API wrapper + auth storage + guards    :b2, 2025-12-25, 1d

  section Auth
  Register page                          :c1, 2025-12-26, 1d
  Login + Logout                         :c2, 2025-12-27, 1d

  section Listings
  Home listings grid                     :d1, 2025-12-28, 1d
  Search listings                        :d2, 2025-12-29, 1d
  Listing detail                         :d3, 2025-12-30, 1d
  Place bid rules + refresh UI           :d4, 2025-12-31, 1d

  section Profile + Create
  Profile (credits)                      :e1, 2026-01-01, 1d
  Update avatar                          :e2, 2026-01-02, 1d
  Create listing                         :e3, 2026-01-03, 1d

  section Polish + Delivery
  Loading/error/empty states             :f1, 2026-01-04, 1d
  Responsive + QA + README               :f2, 2026-01-05, 1d
  Buffer / bugfix                         :f3, 2026-01-06, 1d
