import { useState, useEffect } from 'react';
import { Send, RefreshCw, CheckCircle, AlertCircle, Info, ExternalLink, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TelegramLinkPanelProps {
  userId: string;
}

export default function TelegramLinkPanel({ userId }: TelegramLinkPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<{
    configured: boolean;
    active?: boolean;
    botUsername?: string;
    botName?: string;
    webhookUrl?: string;
    hasWebhook?: boolean;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/telegram/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        throw new Error('Failed to load status');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to check Telegram configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRegister = async () => {
    setIsRegistering(true);
    setErrorMsg(null);
    setRegistrationSuccess(false);
    try {
      const currentUrl = window.location.origin;
      const res = await fetch('/api/telegram/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appUrl: currentUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register webhook');
      }

      setRegistrationSuccess(true);
      await fetchStatus();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Webhook registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 cursor-pointer shadow-[inset_0_0_20px_rgba(255,255,255,0.01)]"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              Telegram Chatbot Assistant
              {status?.configured && status?.active && (
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </h3>
            <p className="text-[10px] text-white/50 font-light mt-0.5">
              {status?.configured 
                ? (status.active ? `Connected as @${status.botUsername}` : 'Setup incomplete') 
                : 'Interact with your ideas from Telegram'}
            </p>
          </div>
        </div>

        <button className="text-[10px] font-mono uppercase font-bold tracking-wider text-sky-400 hover:text-sky-300">
          {isOpen ? 'Close' : 'Manage'}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-md space-y-4 text-xs font-light leading-relaxed">
              {isLoading && !status ? (
                <div className="flex items-center gap-2 py-4 justify-center text-white/50">
                  <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
                  <span>Loading bot status...</span>
                </div>
              ) : !status?.configured ? (
                /* Unconfigured view with helpful steps */
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-200">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-semibold block text-[11px] mb-1">Telegram Token Required</span>
                      You haven't configured a Telegram Bot Token. To chat with your IdeaVault on your phone, you need to set up a free bot!
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-white text-[11px] uppercase tracking-wider font-mono">How to Set Up:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-[11px] text-white/70 pl-1">
                      <li>
                        Open Telegram and search for <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline font-medium inline-flex items-center gap-0.5">@BotFather <ExternalLink className="h-2.5 w-2.5" /></a>.
                      </li>
                      <li>
                        Send <code>/newbot</code> to create a bot. Give it a name (e.g. <i>My Idea Vault</i>) and a username ending in bot.
                      </li>
                      <li>
                        Copy the long API Token provided (looks like <code>123456:ABC-DEF...</code>).
                      </li>
                      <li>
                        In AI Studio, click the <b>Settings icon</b> (top-right), choose <b>Secrets</b>, add a new key named <code className="text-sky-300">TELEGRAM_BOT_TOKEN</code> and paste your token.
                      </li>
                      <li>
                        Once saved, click below to refresh the link panel!
                      </li>
                    </ol>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={fetchStatus}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Refresh Status
                    </button>
                  </div>
                </div>
              ) : (
                /* Configured view */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                      <span className="text-[9px] font-mono uppercase text-white/40 block">Bot Identity</span>
                      <span className="font-medium text-white text-xs">{status.botName}</span>
                      <span className="text-[10px] text-sky-400 block mt-0.5">@{status.botUsername}</span>
                    </div>

                    <div className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                      <span className="text-[9px] font-mono uppercase text-white/40 block">Webhook Connection</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {status.hasWebhook ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="font-medium text-emerald-300 text-xs">Active</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                            <span className="font-medium text-amber-300 text-xs">Unregistered</span>
                          </>
                        )}
                      </div>
                      <span className="text-[9px] text-white/40 block mt-0.5 truncate max-w-[200px]" title={status.webhookUrl}>
                        {status.webhookUrl || 'No registered endpoint'}
                      </span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                      {errorMsg}
                    </div>
                  )}

                  {registrationSuccess && (
                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 text-[11px] flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                      Webhook registered & bot activated successfully!
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/[0.04] flex flex-col sm:flex-row gap-2 justify-between items-center">
                    <button
                      onClick={fetchStatus}
                      disabled={isLoading}
                      className="text-[10px] font-semibold text-white/50 hover:text-white flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                      Sync Bot Status
                    </button>

                    <div className="flex items-center gap-2">
                      {!status.hasWebhook && (
                        <button
                          onClick={handleRegister}
                          disabled={isRegistering}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        >
                          {isRegistering ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Settings className="h-3 w-3" />
                          )}
                          Register & Connect Bot
                        </button>
                      )}

                      {status.hasWebhook && (
                        <>
                          <button
                            onClick={handleRegister}
                            disabled={isRegistering}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white/70 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer"
                            title="Update Webhook Connection"
                          >
                            {isRegistering ? (
                              <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Reconnect
                          </button>

                          <a
                            href={`https://t.me/${status.botUsername}?start=${userId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_15px_rgba(14,165,233,0.4)] transition-all duration-300 active:scale-95 cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            Launch Telegram Chat
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
