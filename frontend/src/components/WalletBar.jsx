import { addressLink } from '../lib/savingsContract'

const short = (address) => `${address.slice(0, 6)}…${address.slice(-4)}`

export default function WalletBar({ wallet }) {
  const { status, address, wrongNetwork, error } = wallet
  return (
    <div className="walletbar">
      {status === 'connected' ? (
        <>
          <a href={addressLink(address)} target="_blank" rel="noreferrer" className="wallet-address" title={address}><span className="wallet-connected-dot" />{short(address)}</a>
          <span className={wrongNetwork ? 'wallet-network network-warning' : 'wallet-network'}>{wrongNetwork ? 'Wrong network' : 'Celo Sepolia'}</span>
          {wrongNetwork && <button className="button button-primary wallet-button" onClick={wallet.switchNetwork}>Switch network</button>}
          <button className="wallet-disconnect" onClick={wallet.disconnect}>Disconnect</button>
        </>
      ) : (
        <>
          <button className="button button-primary wallet-button" disabled={status === 'connecting'} onClick={() => wallet.connect('injected')}>{status === 'connecting' ? 'Connecting…' : 'Connect wallet'}</button>
          <button className="wallet-connect-alt" disabled={status === 'connecting'} onClick={() => wallet.connect('walletconnect')}>WalletConnect</button>
        </>
      )}
      {error && <span className="wallet-error" role="alert">{error}</span>}
    </div>
  )
}
