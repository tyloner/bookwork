"use client";

import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: {
    name: string | null;
    image: string | null;
  } | null;
}

export function MatchModal({ isOpen, onClose, matchedUser }: MatchModalProps) {
  if (!matchedUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sage-100 to-amber-100 mb-4">
          <Sparkles className="w-8 h-8 text-sage-600" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-ink-900 mb-1">
          It&apos;s a match!
        </h2>
        <p className="text-sm text-ink-500 mb-6">
          You and {matchedUser.name} are reading the same book
        </p>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="relative">
            <Avatar
              src={null}
              name="You"
              size="xl"
              className="ring-4 ring-sage-200"
            />
            <Heart className="absolute -bottom-1 -right-1 w-6 h-6 text-red-500 fill-red-500" />
          </div>
          <div className="relative">
            <Avatar
              src={matchedUser.image}
              name={matchedUser.name || "Reader"}
              size="xl"
              className="ring-4 ring-sage-200"
            />
            <Heart className="absolute -bottom-1 -right-1 w-6 h-6 text-red-500 fill-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onClose}
            className="btn-primary w-full gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Send a message
          </button>
          <button
            onClick={onClose}
            className="btn-ghost w-full text-sm"
          >
            Keep browsing
          </button>
        </div>
      </div>
    </Modal>
  );
}
