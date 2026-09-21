"""
Comprehensive Halal & Shariah-Compliant Crypto + Major Meme Coins Universe
For Nexus Capital Trading Intelligence Platform
"""

from typing import Dict, List, Optional
from pydantic import BaseModel

class AssetMetadata(BaseModel):
    symbol: str
    name: str
    category: str  # commodity, crypto, stablecoin
    shariah_status: str  # "HALAL_COMPLIANT", "GREY_AREA_MEME"
    tradingview_symbol: str
    yfinance_ticker: str
    benchmark: str
    is_tradeable: bool
    description: str

ASSET_UNIVERSE: Dict[str, AssetMetadata] = {
    # -------------------------------------------------------------
    # COMMODITIES & FOREX
    # -------------------------------------------------------------
    "XAUUSD": AssetMetadata(
        symbol="XAUUSD",
        name="Gold / US Dollar",
        category="commodity",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="OANDA:XAUUSD",
        yfinance_ticker="GC=F",
        benchmark="DX-Y.NYB",
        is_tradeable=True,
        description="Physical Gold asset against USD via direct MT5 IC Markets Bridge."
    ),
    "XAGUSD": AssetMetadata(
        symbol="XAGUSD",
        name="Silver Spot / US Dollar",
        category="commodity",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="OANDA:XAGUSD",
        yfinance_ticker="SI=F",
        benchmark="DX-Y.NYB",
        is_tradeable=True,
        description="Physical Silver against USD spot market."
    ),
    "USOIL": AssetMetadata(
        symbol="USOIL",
        name="Crude Oil Cash",
        category="commodity",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="TVC:USOIL",
        yfinance_ticker="CL=F",
        benchmark="DX-Y.NYB",
        is_tradeable=True,
        description="Spot West Texas Intermediate (WTI) Crude Oil Cash index against USD."
    ),
    "EURUSD": AssetMetadata(
        symbol="EURUSD",
        name="Euro / US Dollar",
        category="forex",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="FX:EURUSD",
        yfinance_ticker="EURUSD=X",
        benchmark="DX-Y.NYB",
        is_tradeable=True,
        description="Euro currency pair against US Dollar."
    ),
    "GBPUSD": AssetMetadata(
        symbol="GBPUSD",
        name="British Pound / US Dollar",
        category="forex",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="FX:GBPUSD",
        yfinance_ticker="GBPUSD=X",
        benchmark="DX-Y.NYB",
        is_tradeable=True,
        description="British Pound sterling against US Dollar."
    ),
    "NDX100": AssetMetadata(
        symbol="NDX100",
        name="Nasdaq 100 Index",
        category="index",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="NASDAQ:NDX",
        yfinance_ticker="^NDX",
        benchmark="SPY",
        is_tradeable=True,
        description="Nasdaq 100 benchmark equities index."
    ),
    "BNB": AssetMetadata(
        symbol="BNB",
        name="BNB Chain",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:BNBUSDT",
        yfinance_ticker="BNB-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="BNB Chain native token."
    ),

    # -------------------------------------------------------------
    # 1. HALAL / SHARIAH-COMPLIANT CRYPTO (INTRADAY + SWING)
    # -------------------------------------------------------------
    "BTC": AssetMetadata(
        symbol="BTC",
        name="Bitcoin",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:BTCUSDT",
        yfinance_ticker="BTC-USD",
        benchmark="SPY",
        is_tradeable=True,
        description="Digital Gold and primary macro store of value."
    ),
    "ETH": AssetMetadata(
        symbol="ETH",
        name="Ethereum",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:ETHUSDT",
        yfinance_ticker="ETH-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Leading global decentralized smart contract & compute network."
    ),
    "SOL": AssetMetadata(
        symbol="SOL",
        name="Solana",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:SOLUSDT",
        yfinance_ticker="SOL-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Ultra high-speed institutional throughput Layer 1 blockchain."
    ),
    "XRP": AssetMetadata(
        symbol="XRP",
        name="XRP",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:XRPUSDT",
        yfinance_ticker="XRP-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Institutional cross-border remittance and payment protocol."
    ),
    "ADA": AssetMetadata(
        symbol="ADA",
        name="Cardano",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:ADAUSDT",
        yfinance_ticker="ADA-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Peer-reviewed proof-of-stake blockchain network."
    ),
    "AVAX": AssetMetadata(
        symbol="AVAX",
        name="Avalanche",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:AVAXUSDT",
        yfinance_ticker="AVAX-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Multi-subnet institutional subnet smart contracts platform."
    ),
    "DOT": AssetMetadata(
        symbol="DOT",
        name="Polkadot",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:DOTUSDT",
        yfinance_ticker="DOT-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Heterogeneous multi-chain interoperability protocol."
    ),
    "NEAR": AssetMetadata(
        symbol="NEAR",
        name="NEAR Protocol",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:NEARUSDT",
        yfinance_ticker="NEAR-USD",
        benchmark="SOL-USD",
        is_tradeable=True,
        description="Sharded AI and user-centric Layer 1 blockchain."
    ),
    "SUI": AssetMetadata(
        symbol="SUI",
        name="Sui",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:SUIUSDT",
        yfinance_ticker="SUI20947-USD",
        benchmark="SOL-USD",
        is_tradeable=True,
        description="High-performance object-centric Layer 1 blockchain powered by Move."
    ),
    "ALGO": AssetMetadata(
        symbol="ALGO",
        name="Algorand",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:ALGOUSDT",
        yfinance_ticker="ALGO-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Shariah-certified pure proof-of-stake carbon-negative blockchain."
    ),
    "HBAR": AssetMetadata(
        symbol="HBAR",
        name="Hedera",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:HBARUSDT",
        yfinance_ticker="HBAR-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Enterprise Hashgraph consensus distributed ledger."
    ),
    "XTZ": AssetMetadata(
        symbol="XTZ",
        name="Tezos",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:XTZUSDT",
        yfinance_ticker="XTZ-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Self-amending on-chain governance smart contract protocol."
    ),
    "ICP": AssetMetadata(
        symbol="ICP",
        name="Internet Computer",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:ICPUSDT",
        yfinance_ticker="ICP-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Decentralized sovereign cloud computing protocol."
    ),
    "TRX": AssetMetadata(
        symbol="TRX",
        name="TRON",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:TRXUSDT",
        yfinance_ticker="TRX-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Global digital settlement and stablecoin velocity network."
    ),
    "LTC": AssetMetadata(
        symbol="LTC",
        name="Litecoin",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:LTCUSDT",
        yfinance_ticker="LTC-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Established peer-to-peer payment and value transfer asset."
    ),
    "BCH": AssetMetadata(
        symbol="BCH",
        name="Bitcoin Cash",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:BCHUSDT",
        yfinance_ticker="BCH-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Hard-fork peer-to-peer transactional currency."
    ),
    "XLM": AssetMetadata(
        symbol="XLM",
        name="Stellar",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:XLMUSDT",
        yfinance_ticker="XLM-USD",
        benchmark="XRP-USD",
        is_tradeable=True,
        description="Islamic Finance / Shariah-certified cross-currency transfer network."
    ),
    "LINK": AssetMetadata(
        symbol="LINK",
        name="Chainlink",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:LINKUSDT",
        yfinance_ticker="LINK-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Decentralized oracle infrastructure connecting real-world data to chains."
    ),
    "OP": AssetMetadata(
        symbol="OP",
        name="Optimism",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:OPUSDT",
        yfinance_ticker="OP-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Ethereum Layer 2 Optimistic Rollup infrastructure network."
    ),
    "UNI": AssetMetadata(
        symbol="UNI",
        name="Uniswap",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:UNIUSDT",
        yfinance_ticker="UNI7083-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Premier decentralized spot exchange and automated market maker."
    ),
    "QNT": AssetMetadata(
        symbol="QNT",
        name="Quant",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:QNTUSDT",
        yfinance_ticker="QNT-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Enterprise Overledger operating system connecting legacy finance to blockchains."
    ),
    "FIL": AssetMetadata(
        symbol="FIL",
        name="Filecoin",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:FILUSDT",
        yfinance_ticker="FIL-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Decentralized peer-to-peer data storage and utility network."
    ),
    "GRT": AssetMetadata(
        symbol="GRT",
        name="The Graph",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:GRTUSDT",
        yfinance_ticker="GRT6719-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Decentralized indexing protocol for querying blockchain networks."
    ),
    "TAO": AssetMetadata(
        symbol="TAO",
        name="Bittensor",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:TAOUSDT",
        yfinance_ticker="TAO22974-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Decentralized machine intelligence and neural network training protocol."
    ),
    "ASI": AssetMetadata(
        symbol="ASI",
        name="Artificial Superintelligence Alliance",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:FETUSDT",
        yfinance_ticker="FET-USD",
        benchmark="TAO22974-USD",
        is_tradeable=True,
        description="Consortium merger of Fetch.ai, SingularityNET, and Ocean Protocol."
    ),
    "AETHIR": AssetMetadata(
        symbol="AETHIR",
        name="Aethir",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:ATHUSDT",
        yfinance_ticker="ATH-USD",
        benchmark="SOL-USD",
        is_tradeable=True,
        description="Enterprise-grade distributed GPU cloud compute network."
    ),
    "PAAL": AssetMetadata(
        symbol="PAAL",
        name="PAAL AI",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="MEXC:PAALUSDT",
        yfinance_ticker="PAAL-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Advanced AI and automated ecosystem research ecosystem."
    ),
    "ETC": AssetMetadata(
        symbol="ETC",
        name="Ethereum Classic",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:ETCUSDT",
        yfinance_ticker="ETC-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Legacy proof-of-work original Ethereum blockchain."
    ),
    "KAS": AssetMetadata(
        symbol="KAS",
        name="Kaspa",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BYBIT:KASUSDT",
        yfinance_ticker="KAS-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Proof-of-work BlockDAG architecture with sub-second block times."
    ),
    "ZEC": AssetMetadata(
        symbol="ZEC",
        name="Zcash",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:ZECUSDT",
        yfinance_ticker="ZEC-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Zero-knowledge privacy-preserving cryptographic payment network."
    ),
    "XMR": AssetMetadata(
        symbol="XMR",
        name="Monero",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="KRAKEN:XMRUSDT",
        yfinance_ticker="XMR-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Untraceable, decentralized privacy currency utilizing RingCT."
    ),
    "QRL": AssetMetadata(
        symbol="QRL",
        name="Quantum Resistant Ledger",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="COINEX:QRLUSDT",
        yfinance_ticker="QRL-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Post-quantum secure cryptographic value network using XMSS."
    ),
    "QTUM": AssetMetadata(
        symbol="QTUM",
        name="Qtum",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:QTUMUSDT",
        yfinance_ticker="QTUM-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Hybrid UTXO blockchain with Ethereum virtual machine capabilities."
    ),
    "IMX": AssetMetadata(
        symbol="IMX",
        name="Immutable",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:IMXUSDT",
        yfinance_ticker="IMX10603-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Ethereum Layer 2 zero-gas protocol for verifiable digital assets."
    ),
    "GRAM": AssetMetadata(
        symbol="GRAM",
        name="Gram",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BYBIT:GRAMUSDT",
        yfinance_ticker="GRAM-USD",
        benchmark="TON-USD",
        is_tradeable=True,
        description="Proof-of-work token on the Open Network (TON) architecture."
    ),
    "DEXE": AssetMetadata(
        symbol="DEXE",
        name="DeXe",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:DEXEUSDT",
        yfinance_ticker="DEXE-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Autonomous social trading and decentralized asset management platform."
    ),
    "ZIG": AssetMetadata(
        symbol="ZIG",
        name="ZIGChain",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BYBIT:ZIGUSDT",
        yfinance_ticker="ZIG-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Wealth-generation and automated wealth-sharing layer protocol."
    ),
    "ZEBEC": AssetMetadata(
        symbol="ZEBEC",
        name="Zebec Network",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BYBIT:ZBCNUSDT",
        yfinance_ticker="ZBCN-USD",
        benchmark="SOL-USD",
        is_tradeable=True,
        description="Continuous real-time settlement and payroll streaming network."
    ),
    "VIB": AssetMetadata(
        symbol="VIB",
        name="Viberate",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:VIBUSDT",
        yfinance_ticker="VIB-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Decentralized live music talent ecosystem and data marketplace."
    ),
    "PAXG": AssetMetadata(
        symbol="PAXG",
        name="PAX Gold",
        category="commodity",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:PAXGUSDT",
        yfinance_ticker="PAXG-USD",
        benchmark="GC=F",
        is_tradeable=True,
        description="100% physically-backed Gold on Ethereum; AAOIFI Shariah-certified."
    ),
    "XAUT": AssetMetadata(
        symbol="XAUT",
        name="Tether Gold",
        category="commodity",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:XAUTUSDT",
        yfinance_ticker="XAUT-USD",
        benchmark="GC=F",
        is_tradeable=True,
        description="Direct physical allocated gold ownership tokenized on blockchain."
    ),
    "RLUSD": AssetMetadata(
        symbol="RLUSD",
        name="Ripple USD",
        category="stablecoin",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:RLUSDUSDT",
        yfinance_ticker="USD",
        benchmark="USD",
        is_tradeable=False,
        description="Enterprise 1:1 USD-backed institutional stablecoin by Ripple."
    ),
    "WLD": AssetMetadata(
        symbol="WLD",
        name="Worldcoin",
        category="crypto",
        shariah_status="HALAL_COMPLIANT",
        tradingview_symbol="BINANCE:WLDUSDT",
        yfinance_ticker="WLD-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Global proof-of-personhood decentralized digital identity protocol."
    ),

    # -------------------------------------------------------------
    # 2. MAJOR MEME COINS (GREY AREA / SEPARATE SHARIAH REVIEW)
    # -------------------------------------------------------------
    "DOGE": AssetMetadata(
        symbol="DOGE",
        name="Dogecoin",
        category="crypto",
        shariah_status="GREY_AREA_MEME",
        tradingview_symbol="BINANCE:DOGEUSDT",
        yfinance_ticker="DOGE-USD",
        benchmark="BTC-USD",
        is_tradeable=True,
        description="Original meme token; high speculative retail momentum (Review Required)."
    ),
    "SHIB": AssetMetadata(
        symbol="SHIB",
        name="Shiba Inu",
        category="crypto",
        shariah_status="GREY_AREA_MEME",
        tradingview_symbol="BINANCE:SHIBUSDT",
        yfinance_ticker="SHIB-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Meme ecosystem token expanding into Shibarium Layer 2."
    ),
    "PEPE": AssetMetadata(
        symbol="PEPE",
        name="Pepe",
        category="crypto",
        shariah_status="GREY_AREA_MEME",
        tradingview_symbol="BINANCE:PEPEUSDT",
        yfinance_ticker="PEPE24478-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="High-velocity meme liquidity token; non-utility speculative asset."
    ),
    "BONK": AssetMetadata(
        symbol="BONK",
        name="Bonk",
        category="crypto",
        shariah_status="GREY_AREA_MEME",
        tradingview_symbol="BINANCE:BONKUSDT",
        yfinance_ticker="BONK-USD",
        benchmark="SOL-USD",
        is_tradeable=True,
        description="Solana community ecosystem meme coin."
    ),
    "FLOKI": AssetMetadata(
        symbol="FLOKI",
        name="Floki",
        category="crypto",
        shariah_status="GREY_AREA_MEME",
        tradingview_symbol="BINANCE:FLOKIUSDT",
        yfinance_ticker="FLOKI-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Meme utility token spanning Valhalla gaming and crypto cards."
    ),
    "WIF": AssetMetadata(
        symbol="WIF",
        name="dogwifhat",
        category="crypto",
        shariah_status="GREY_AREA_MEME",
        tradingview_symbol="BINANCE:WIFUSDT",
        yfinance_ticker="WIF-USD",
        benchmark="SOL-USD",
        is_tradeable=True,
        description="Viral Solana meme token; purely community momentum-driven."
    ),
    "BRETT": AssetMetadata(
        symbol="BRETT",
        name="Brett",
        category="crypto",
        shariah_status="GREY_AREA_MEME",
        tradingview_symbol="BYBIT:BRETTUSDT",
        yfinance_ticker="BRETT-USD",
        benchmark="ETH-USD",
        is_tradeable=True,
        description="Primary community mascot token on Base Layer 2 ecosystem."
    ),
}

ALIASES = {
    "OIL": "USOIL",
    "WTI": "USOIL",
    "CRUDE": "USOIL",
    "USOILCASH": "USOIL",
    "OILCRUDE": "USOIL",
    "ATH": "AETHIR",
    "FET": "ASI",
    "ZBCN": "ZEBEC",
    "GOLD": "XAUUSD",
    "SILVER": "XAGUSD",
}

def get_asset(symbol: str) -> Optional[AssetMetadata]:
    key = symbol.upper().replace("/", "").replace("-", "").replace(".", "").strip()
    if key in ALIASES:
        key = ALIASES[key]
    if key in ASSET_UNIVERSE:
        return ASSET_UNIVERSE[key]
    for asset in ASSET_UNIVERSE.values():
        if asset.symbol.upper() == key or asset.yfinance_ticker.upper() == symbol.upper():
            return asset
    return None

def list_halal_assets() -> List[AssetMetadata]:
    return [a for a in ASSET_UNIVERSE.values() if a.shariah_status == "HALAL_COMPLIANT"]

def list_meme_assets() -> List[AssetMetadata]:
    return [a for a in ASSET_UNIVERSE.values() if a.shariah_status == "GREY_AREA_MEME"]

def list_tradeable_assets() -> List[AssetMetadata]:
    return [asset for asset in ASSET_UNIVERSE.values() if asset.is_tradeable]

def list_all_assets() -> List[AssetMetadata]:
    return list(ASSET_UNIVERSE.values())
