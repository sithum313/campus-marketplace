import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "../components/AppIcon";
import { ProductImage } from "../components/ProductImage";
import {
  CAMPUS_MEETUP_SPOTS,
  CAMPUS_PROMOS,
  CAMPUS_TIME_WINDOWS,
  CampusMeetupSpot,
  CampusTimeWindow,
  CheckoutDetails,
  applyPromoCode,
  meetupSpotById,
  priceCart,
  timeWindowById,
  variantLabel,
} from "../lib/cart";
import { colors, money } from "../theme";
import { CartLine, Listing, Offer } from "../types";

export function CartPage({
  lines,
  items,
  offers,
  onQty,
  onRemove,
  onSaveForLater,
  onOpen,
  onBrowse,
  onCheckout,
}: {
  lines: CartLine[];
  items: Listing[];
  offers: Offer[];
  onQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onSaveForLater?: (itemId: string, key: string) => void;
  onOpen: (item: Listing) => void;
  onBrowse: () => void;
  onCheckout: (details?: CheckoutDetails) => void;
}) {
  const { rows, subtotal, savings, total } = priceCart(lines, items, offers);

  // Campus meetup location selection
  const [selectedSpotId, setSelectedSpotId] = useState<string>("lib-lobby");
  // Campus preferred handover time selection
  const [selectedTimeId, setSelectedTimeId] = useState<string>("lunch");
  // Buyer notes for seller
  const [buyerNotes, setBuyerNotes] = useState<string>("");

  // Promo code state
  const [promoInput, setPromoInput] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    label: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string>("");
  const [promoSuccess, setPromoSuccess] = useState<string>("");

  // Order confirmation review modal
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  const totalUnits = lines.reduce((acc, curr) => acc + curr.qty, 0);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = codeToApply || promoInput;
    setPromoError("");
    setPromoSuccess("");

    if (!code.trim()) {
      setPromoError("Please enter a valid student promo code.");
      return;
    }

    const result = applyPromoCode(code, subtotal);
    if (result.valid && result.promo) {
      setAppliedPromo({
        code: result.promo.code,
        discount: result.discount,
        label: result.promo.label,
      });
      setPromoSuccess(result.message);
      setPromoInput("");
    } else {
      setPromoError(result.message);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoSuccess("");
    setPromoError("");
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove All",
          style: "destructive",
          onPress: () => {
            lines.forEach((l) => onRemove(l.key));
            handleRemovePromo();
          },
        },
      ],
    );
  };

  const effectivePromoDiscount = appliedPromo ? appliedPromo.discount : 0;
  const finalTotal = Math.max(0, Math.round((total - effectivePromoDiscount) * 100) / 100);
  const allSavings = Math.round((savings + effectivePromoDiscount) * 100) / 100;

  const selectedSpot = meetupSpotById(selectedSpotId) || CAMPUS_MEETUP_SPOTS[0];
  const selectedTime = timeWindowById(selectedTimeId) || CAMPUS_TIME_WINDOWS[0];

  const sellers = Array.from(new Set(rows.map((r) => r.item.seller)));
  const isMultiSeller = sellers.length > 1;

  const handleConfirmOrder = () => {
    setShowReviewModal(false);
    onCheckout({
      meetupSpotId: selectedSpot.id,
      meetupSpotName: selectedSpot.name,
      meetupTime: `${selectedTime.label} (${selectedTime.desc.split("(")[0].trim()})`,
      notes: buyerNotes.trim() || undefined,
      promoCode: appliedPromo?.code,
      promoDiscount: effectivePromoDiscount,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Campus Cart</Text>
              {rows.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {totalUnits} {totalUnits === 1 ? "item" : "items"}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.subtitle}>
              Student-to-student handover on campus
            </Text>
          </View>

          {rows.length > 0 ? (
            <Pressable
              style={styles.clearBtn}
              onPress={handleClearAll}
              hitSlop={8}
              accessibilityLabel="Clear entire cart"
            >
              <AppIcon name="trash-outline" size={16} color={colors.red} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {rows.length === 0 ? (
          /* Empty Cart State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="cart-outline" size={42} color={colors.ink} />
              <View style={styles.emptySparkle}>
                <AppIcon name="sparkles" size={16} color={colors.yellow} />
              </View>
            </View>

            <Text style={styles.emptyTitle}>Your campus cart is empty</Text>
            <Text style={styles.emptyText}>
              Find textbooks, lab gear, tech, apparel, and dorm furniture directly
              from fellow students.
            </Text>

            {/* Quick Categories to Explore */}
            <View style={styles.suggestedBox}>
              <Text style={styles.suggestedTitle}>Popular Campus Categories</Text>
              <View style={styles.chipRow}>
                {[
                  { label: "📚 Textbooks", tag: "textbooks" },
                  { label: "💻 Tech & Gadgets", tag: "tech" },
                  { label: "👕 College Merch", tag: "merch" },
                  { label: "🚲 Campus Commute", tag: "commute" },
                ].map((cat) => (
                  <Pressable
                    key={cat.tag}
                    style={styles.categoryChip}
                    onPress={onBrowse}
                  >
                    <Text style={styles.categoryChipText}>{cat.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable style={styles.browseButton} onPress={onBrowse}>
              <AppIcon name="search-outline" size={18} color="#FFF" />
              <Text style={styles.browseButtonText}>Explore Marketplace</Text>
            </Pressable>
          </View>
        ) : (
          /* Populated Cart Content */
          <>
            {/* Campus Safety & Meetup Notice */}
            <View style={styles.safetyNotice}>
              <View style={styles.safetyNoticeIconWrap}>
                <AppIcon name="shield-checkmark" size={18} color="#1E88E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.safetyNoticeTitle}>
                  Free On-Campus Student Handover
                </Text>
                <Text style={styles.safetyNoticeText}>
                  No delivery charges. Inspect your items in person at a verified
                  campus meetup spot before releasing payment.
                </Text>
              </View>
            </View>

            {/* Multi-Seller Notice */}
            {isMultiSeller ? (
              <View style={styles.multiSellerNotice}>
                <View style={styles.multiSellerIconWrap}>
                  <AppIcon name="people-outline" size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.multiSellerTitle}>
                    Multi-Seller Order ({sellers.length} Sellers)
                  </Text>
                  <Text style={styles.multiSellerText}>
                    Items are from <Text style={{ fontWeight: "700" }}>{sellers.join(", ")}</Text>. Handover will be coordinated with each seller individually on campus.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Cart Item Cards */}
            <View style={styles.itemsList}>
              {rows.map(({ line, item, discount, labels }) => {
                const lineTotal = Math.round(item.price * line.qty * 100) / 100;
                const hasDiscount = discount > 0;
                const isLowStock = item.stock !== undefined && item.stock <= 3;

                return (
                  <View key={line.key} style={styles.itemCard}>
                    {/* Item Seller & Campus Header */}
                    <View style={styles.itemHeader}>
                      <View style={styles.sellerRow}>
                        <View style={styles.sellerAvatarCircle}>
                          <AppIcon name="school-outline" size={12} color="#1E88E5" />
                        </View>
                        <Text style={styles.sellerName} numberOfLines={1}>
                          Sold by <Text style={{ fontWeight: "700" }}>{item.seller}</Text>
                        </Text>
                      </View>
                      <View style={styles.handoverBadge}>
                        <AppIcon name="location-outline" size={12} color={colors.green} />
                        <Text style={styles.handoverBadgeText}>Campus Meetup</Text>
                      </View>
                    </View>

                    {/* Item Body Row */}
                    <View style={styles.itemBody}>
                      <Pressable
                        style={styles.thumbContainer}
                        onPress={() => onOpen(item)}
                        accessibilityLabel={`View ${item.title}`}
                      >
                        <ProductImage item={item} iconSize={30} />
                        {item.discountPercent ? (
                          <View style={styles.thumbDiscountBadge}>
                            <Text style={styles.thumbDiscountText}>
                              -{item.discountPercent}%
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>

                      <View style={styles.itemDetails}>
                        <Pressable onPress={() => onOpen(item)}>
                          <Text style={styles.itemName} numberOfLines={2}>
                            {item.title}
                          </Text>
                        </Pressable>

                        {/* Variant and Category Badges */}
                        <View style={styles.metaRow}>
                          {variantLabel(line) ? (
                            <View style={styles.variantBadge}>
                              <Text style={styles.variantText}>
                                {variantLabel(line)}
                              </Text>
                            </View>
                          ) : null}
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                              {item.category || "General"}
                            </Text>
                          </View>
                        </View>

                        {/* Stock Warning */}
                        {isLowStock ? (
                          <View style={styles.stockAlertRow}>
                            <AppIcon name="flame" size={13} color={colors.red} />
                            <Text style={styles.stockAlertText}>
                              Only {item.stock} left in stock
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.stockInRow}>
                            <View style={styles.inStockDot} />
                            <Text style={styles.inStockText}>Available on Campus</Text>
                          </View>
                        )}

                        {/* Price & Quantity Controls */}
                        <View style={styles.pricingAndStepperRow}>
                          <View>
                            <Text style={styles.linePrice}>
                              {money(lineTotal)}
                            </Text>
                            {line.qty > 1 ? (
                              <Text style={styles.unitPrice}>
                                {money(item.price)} each
                              </Text>
                            ) : null}
                          </View>

                          <View style={styles.stepperContainer}>
                            <Pressable
                              style={styles.stepBtn}
                              hitSlop={8}
                              onPress={() => onQty(line.key, Math.max(1, line.qty - 1))}
                              accessibilityLabel="Decrease quantity"
                            >
                              <AppIcon name="remove" size={14} color={colors.ink} />
                            </Pressable>
                            <Text style={styles.stepNumber}>{line.qty}</Text>
                            <Pressable
                              style={styles.stepBtn}
                              hitSlop={8}
                              onPress={() =>
                                onQty(
                                  line.key,
                                  Math.min(item.stock || 99, line.qty + 1),
                                )
                              }
                              accessibilityLabel="Increase quantity"
                            >
                              <AppIcon name="add" size={14} color={colors.ink} />
                            </Pressable>
                          </View>
                        </View>

                        {/* Applied Promotional Event Discount */}
                        {hasDiscount ? (
                          <View style={styles.discountCallout}>
                            <AppIcon name="pricetag" size={12} color={colors.green} />
                            <Text style={styles.discountCalloutText} numberOfLines={1}>
                              {labels.join(" · ")}: Saved −{money(discount)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Card Bottom: Save for later & Remove */}
                    <View style={styles.itemCardFooter}>
                      <View style={styles.footerActionGroup}>
                        {onSaveForLater ? (
                          <Pressable
                            style={styles.saveForLaterBtn}
                            onPress={() => onSaveForLater(item.id, line.key)}
                            hitSlop={6}
                            accessibilityLabel={`Save ${item.title} for later`}
                          >
                            <AppIcon name="bookmark-outline" size={14} color="#1E88E5" />
                            <Text style={styles.saveForLaterText}>Save for later</Text>
                          </Pressable>
                        ) : null}

                        <Pressable
                          style={styles.removeItemBtn}
                          onPress={() => onRemove(line.key)}
                          hitSlop={6}
                          accessibilityLabel={`Remove ${item.title}`}
                        >
                          <AppIcon name="trash-outline" size={14} color={colors.muted} />
                          <Text style={styles.removeItemText}>Remove</Text>
                        </Pressable>
                      </View>

                      <Pressable
                        style={styles.viewDetailsLink}
                        onPress={() => onOpen(item)}
                      >
                        <Text style={styles.viewDetailsText}>Details</Text>
                        <AppIcon name="chevron-forward" size={12} color={colors.muted} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Campus Meetup Location Picker */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <AppIcon name="location" size={18} color="#1E88E5" />
                  <Text style={styles.sectionTitle}>
                    Select Campus Handover Spot
                  </Text>
                </View>
                <Text style={styles.sectionHelp}>
                  Choose where you prefer to meet sellers on campus
                </Text>
              </View>

              <View style={styles.meetupSpotsGrid}>
                {CAMPUS_MEETUP_SPOTS.map((spot: CampusMeetupSpot) => {
                  const isSelected = selectedSpotId === spot.id;
                  return (
                    <Pressable
                      key={spot.id}
                      style={[
                        styles.spotCard,
                        isSelected && styles.spotCardActive,
                      ]}
                      onPress={() => setSelectedSpotId(spot.id)}
                    >
                      <View style={styles.spotTop}>
                        <View
                          style={[
                            styles.spotIconCircle,
                            isSelected && styles.spotIconCircleActive,
                          ]}
                        >
                          <AppIcon
                            name={spot.icon}
                            size={18}
                            color={isSelected ? "#FFF" : colors.ink}
                          />
                        </View>
                        {isSelected ? (
                          <View style={styles.spotCheckmark}>
                            <AppIcon
                              name="checkmark-circle"
                              size={18}
                              color="#1E88E5"
                            />
                          </View>
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.spotName,
                          isSelected && styles.spotNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {spot.shortName}
                      </Text>
                      <Text style={styles.spotDesc} numberOfLines={2}>
                        {spot.desc}
                      </Text>

                      <View style={styles.safetyTagPill}>
                        <Text style={styles.safetyTagText}>{spot.safetyTag}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Campus Handover Time Window Picker */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <AppIcon name="time" size={18} color="#E65100" />
                  <Text style={styles.sectionTitle}>
                    Preferred Handover Timing
                  </Text>
                </View>
                <Text style={styles.sectionHelp}>
                  Choose when you are available between classes for the meetup
                </Text>
              </View>

              <View style={styles.timeSlotsGrid}>
                {CAMPUS_TIME_WINDOWS.map((window: CampusTimeWindow) => {
                  const isSelected = selectedTimeId === window.id;
                  return (
                    <Pressable
                      key={window.id}
                      style={[
                        styles.timeSlotCard,
                        isSelected && styles.timeSlotCardActive,
                      ]}
                      onPress={() => setSelectedTimeId(window.id)}
                    >
                      <View style={styles.timeSlotTop}>
                        <AppIcon
                          name={window.icon}
                          size={15}
                          color={isSelected ? "#E65100" : colors.muted}
                        />
                        <Text
                          style={[
                            styles.timeSlotTitle,
                            isSelected && styles.timeSlotTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {window.label}
                        </Text>
                      </View>
                      <Text style={styles.timeSlotDesc} numberOfLines={1}>
                        {window.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Buyer Handover Note for Seller */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <AppIcon name="chatbubble-ellipses-outline" size={18} color="#0D9488" />
                  <Text style={styles.sectionTitle}>
                    Handover Note for Seller (Optional)
                  </Text>
                </View>
                <Text style={styles.sectionHelp}>
                  Add details to help the seller spot you on campus
                </Text>
              </View>

              <TextInput
                style={styles.notesInput}
                placeholder="e.g. Wearing a blue hoodie, sitting near the entrance stairs"
                placeholderTextColor={colors.muted}
                value={buyerNotes}
                onChangeText={setBuyerNotes}
                maxLength={140}
              />
              <Text style={styles.notesCharCount}>
                {buyerNotes.length}/140
              </Text>
            </View>

            {/* Campus Promo Voucher Input */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <AppIcon name="ticket-outline" size={18} color="#E5484D" />
                  <Text style={styles.sectionTitle}>Student Promo Voucher</Text>
                </View>
                <Text style={styles.sectionHelp}>
                  Enter or select an exclusive campus discount code
                </Text>
              </View>

              {appliedPromo ? (
                <View style={styles.appliedPromoCard}>
                  <View style={styles.appliedPromoLeft}>
                    <View style={styles.promoTagIcon}>
                      <AppIcon name="checkmark" size={14} color="#FFF" />
                    </View>
                    <View>
                      <Text style={styles.appliedPromoCode}>
                        {appliedPromo.code}
                      </Text>
                      <Text style={styles.appliedPromoLabel}>
                        {appliedPromo.label} (−{money(appliedPromo.discount)})
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.removePromoBtn}
                    onPress={handleRemovePromo}
                    hitSlop={8}
                    accessibilityLabel="Remove promo"
                  >
                    <AppIcon name="close-circle" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.promoInputRow}>
                    <TextInput
                      style={styles.promoInput}
                      placeholder="e.g. CAMPUS10"
                      placeholderTextColor={colors.muted}
                      value={promoInput}
                      onChangeText={(t) => {
                        setPromoInput(t);
                        if (promoError) setPromoError("");
                      }}
                      autoCapitalize="characters"
                      returnKeyType="done"
                      onSubmitEditing={() => handleApplyPromo()}
                    />
                    <Pressable
                      style={styles.promoApplyBtn}
                      onPress={() => handleApplyPromo()}
                    >
                      <Text style={styles.promoApplyBtnText}>Apply</Text>
                    </Pressable>
                  </View>

                  {/* Available student promo chips */}
                  <View style={styles.suggestedPromoRow}>
                    <Text style={styles.suggestedPromoLabel}>Student perks:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {CAMPUS_PROMOS.map((p) => (
                        <Pressable
                          key={p.code}
                          style={styles.promoChip}
                          onPress={() => handleApplyPromo(p.code)}
                        >
                          <Text style={styles.promoChipText}>{p.code}</Text>
                          <Text style={styles.promoChipSub}>
                            {p.discountType === "percent" ? `${p.amount}% off` : `$${p.amount} off`}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {promoError ? (
                    <Text style={styles.promoErrorText}>{promoError}</Text>
                  ) : null}
                </>
              )}

              {promoSuccess ? (
                <Text style={styles.promoSuccessText}>{promoSuccess}</Text>
              ) : null}
            </View>

            {/* Detailed Order Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Price Breakdown</Text>

              <View style={styles.sumLine}>
                <Text style={styles.sumLabel}>
                  Subtotal ({totalUnits} {totalUnits === 1 ? "item" : "items"})
                </Text>
                <Text style={styles.sumVal}>{money(subtotal)}</Text>
              </View>

              {savings > 0 ? (
                <View style={styles.sumLine}>
                  <View style={styles.savingsLabelGroup}>
                    <AppIcon name="pricetag" size={14} color={colors.green} />
                    <Text style={[styles.sumLabel, { color: colors.green }]}>
                      Campus Event Offers
                    </Text>
                  </View>
                  <Text style={[styles.sumVal, { color: colors.green }]}>
                    −{money(savings)}
                  </Text>
                </View>
              ) : null}

              {effectivePromoDiscount > 0 ? (
                <View style={styles.sumLine}>
                  <View style={styles.savingsLabelGroup}>
                    <AppIcon name="ticket" size={14} color={colors.green} />
                    <Text style={[styles.sumLabel, { color: colors.green }]}>
                      Student Voucher ({appliedPromo?.code})
                    </Text>
                  </View>
                  <Text style={[styles.sumVal, { color: colors.green }]}>
                    −{money(effectivePromoDiscount)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.sumLine}>
                <Text style={styles.sumLabel}>Campus Pickup / Handover</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              </View>

              <View style={styles.sumLine}>
                <Text style={styles.sumLabel}>Student Platform Fee</Text>
                <Text style={styles.sumVal}>$0.00</Text>
              </View>

              <View style={styles.dashedDivider} />

              <View style={styles.totalLine}>
                <View>
                  <Text style={styles.totalLabel}>Grand Total</Text>
                  <Text style={styles.totalMeta}>All campus taxes included</Text>
                </View>
                <Text style={styles.totalValue}>{money(finalTotal)}</Text>
              </View>

              {allSavings > 0 ? (
                <View style={styles.savingsHighlightBanner}>
                  <AppIcon name="gift-outline" size={16} color="#155724" />
                  <Text style={styles.savingsHighlightText}>
                    You are saving {money(allSavings)} on this campus order!
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Campus Buyer Guarantee Banner */}
            <View style={styles.protectionCard}>
              <View style={styles.protectionIconWrap}>
                <AppIcon
                  name="shield-checkmark-outline"
                  size={22}
                  color={colors.ink}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.protectionTitle}>Campus Safety Guarantee</Text>
                <Text style={styles.protectionDesc}>
                  100% peer-to-peer security. You only complete payment after
                  handover and physical verification at your selected campus spot.
                </Text>
              </View>
            </View>

            {/* Checkout Action CTA */}
            <View style={styles.checkoutBar}>
              <View style={styles.checkoutMeta}>
                <Text style={styles.checkoutMetaLabel}>Payable Total</Text>
                <Text style={styles.checkoutMetaAmount}>{money(finalTotal)}</Text>
              </View>
              <Pressable
                style={styles.checkoutButton}
                onPress={() => setShowReviewModal(true)}
                accessibilityLabel="Review campus order"
              >
                <AppIcon name="bag-check-outline" size={18} color="#FFF" />
                <Text style={styles.checkoutButtonText}>Review & Place Order</Text>
                <AppIcon name="arrow-forward" size={16} color="#FFF" />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Order Review & Handover Confirmation Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Confirm Campus Order</Text>
                <Text style={styles.modalSub}>
                  {totalUnits} {totalUnits === 1 ? "item" : "items"} · Handover on campus
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowReviewModal(false)}
                hitSlop={8}
              >
                <AppIcon name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 380 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Meetup Logistics Recap */}
              <View style={styles.reviewLogisticsCard}>
                <View style={styles.reviewLogisticsRow}>
                  <View style={styles.reviewIconCircle}>
                    <AppIcon name="location" size={16} color="#1E88E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewLogisticsLabel}>Meetup Location</Text>
                    <Text style={styles.reviewLogisticsValue}>{selectedSpot.name}</Text>
                    <Text style={styles.reviewLogisticsSub}>{selectedSpot.desc} · {selectedSpot.safetyTag}</Text>
                  </View>
                </View>

                <View style={styles.reviewLogisticsDivider} />

                <View style={styles.reviewLogisticsRow}>
                  <View style={[styles.reviewIconCircle, { backgroundColor: "#FFF3E0" }]}>
                    <AppIcon name="time" size={16} color="#E65100" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewLogisticsLabel}>Handover Timing</Text>
                    <Text style={styles.reviewLogisticsValue}>{selectedTime.label}</Text>
                    <Text style={styles.reviewLogisticsSub}>{selectedTime.desc}</Text>
                  </View>
                </View>

                {buyerNotes.trim() ? (
                  <>
                    <View style={styles.reviewLogisticsDivider} />
                    <View style={styles.reviewLogisticsRow}>
                      <View style={[styles.reviewIconCircle, { backgroundColor: "#E0F2F1" }]}>
                        <AppIcon name="chatbubble-ellipses" size={16} color="#00796B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewLogisticsLabel}>Your Note to Seller</Text>
                        <Text style={styles.reviewLogisticsValue}>"{buyerNotes.trim()}"</Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Order Items Summary */}
              <View style={styles.reviewItemsCard}>
                <Text style={styles.reviewItemsTitle}>Order Items</Text>
                {rows.map(({ line, item }) => (
                  <View key={line.key} style={styles.reviewItemRow}>
                    <Text style={styles.reviewItemQty}>{line.qty}×</Text>
                    <Text style={styles.reviewItemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.reviewItemPrice}>
                      {money(item.price * line.qty)}
                    </Text>
                  </View>
                ))}

                <View style={styles.reviewDivider} />

                <View style={styles.reviewTotalRow}>
                  <Text style={styles.reviewTotalLabel}>Total Payable</Text>
                  <Text style={styles.reviewTotalVal}>{money(finalTotal)}</Text>
                </View>
                {allSavings > 0 ? (
                  <Text style={styles.reviewSavingsNotice}>
                    Includes {money(allSavings)} student discounts & perks
                  </Text>
                ) : null}
              </View>

              {/* Safety Assurance Callout */}
              <View style={styles.reviewSafetyBox}>
                <AppIcon name="shield-checkmark" size={16} color="#2E7D32" />
                <Text style={styles.reviewSafetyText}>
                  Pay in cash or peer pay during the physical handover. Never send advance payment before meeting.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirmBtn}
                onPress={handleConfirmOrder}
              >
                <AppIcon name="checkmark-circle" size={18} color="#FFF" />
                <Text style={styles.modalConfirmBtnText}>Confirm & Place Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    backgroundColor: "#F7F9FC",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    color: "#1E88E5",
    fontSize: 12,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FDECEC",
  },
  clearBtnText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    position: "relative",
  },
  emptySparkle: {
    position: "absolute",
    top: 10,
    right: 12,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 320,
  },
  suggestedBox: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  suggestedTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#F0F4F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  categoryChipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginTop: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  browseButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Safety Notice */
  safetyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EBF5FB",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#CFE8F7",
  },
  safetyNoticeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  safetyNoticeTitle: {
    color: "#1565C0",
    fontSize: 13,
    fontWeight: "700",
  },
  safetyNoticeText: {
    color: "#4A6572",
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },

  /* Multi-Seller Notice */
  multiSellerNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  multiSellerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  multiSellerTitle: {
    color: "#B45309",
    fontSize: 13,
    fontWeight: "700",
  },
  multiSellerText: {
    color: "#78350F",
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },

  /* Item Cards */
  itemsList: {
    gap: 14,
    marginBottom: 18,
  },
  itemCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    paddingBottom: 8,
    marginBottom: 10,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  sellerAvatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E8F0FE",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerName: {
    color: colors.ink,
    fontSize: 12,
  },
  handoverBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9F4",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  handoverBadgeText: {
    color: colors.green,
    fontSize: 10.5,
    fontWeight: "700",
  },
  itemBody: {
    flexDirection: "row",
    gap: 12,
  },
  thumbContainer: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: "#F6F8FB",
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  thumbDiscountBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: colors.red,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  thumbDiscountText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  variantBadge: {
    backgroundColor: "#F0F4F8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  variantText: {
    color: colors.ink,
    fontSize: 10.5,
    fontWeight: "600",
  },
  categoryBadge: {
    backgroundColor: "#F9FAFC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  categoryText: {
    color: colors.muted,
    fontSize: 10.5,
  },
  stockAlertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  stockAlertText: {
    color: colors.red,
    fontSize: 11,
    fontWeight: "700",
  },
  stockInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  inStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  inStockText: {
    color: colors.muted,
    fontSize: 11,
  },
  pricingAndStepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  linePrice: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  unitPrice: {
    color: colors.muted,
    fontSize: 11,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F5F9",
    borderRadius: 12,
    padding: 2,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepNumber: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 10,
  },
  discountCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EDF8F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  discountCalloutText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  itemCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F4F6F9",
    paddingTop: 8,
    marginTop: 10,
  },
  footerActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveForLaterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  saveForLaterText: {
    color: "#1E88E5",
    fontSize: 12,
    fontWeight: "600",
  },
  removeItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  removeItemText: {
    color: colors.muted,
    fontSize: 12,
  },
  viewDetailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewDetailsText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  /* Section Card (Meetup, Timing, Promo, Notes) */
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  sectionHelp: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },

  /* Meetup Spots Grid */
  meetupSpotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  spotCard: {
    width: "48.5%",
    backgroundColor: "#F9FAFC",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  spotCardActive: {
    backgroundColor: "#F0F7FF",
    borderColor: "#1E88E5",
  },
  spotTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  spotIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EBF1F8",
    alignItems: "center",
    justifyContent: "center",
  },
  spotIconCircleActive: {
    backgroundColor: "#1E88E5",
  },
  spotCheckmark: {},
  spotName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  spotNameActive: {
    color: "#1565C0",
  },
  spotDesc: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
    height: 28,
  },
  safetyTagPill: {
    backgroundColor: "#FFF",
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 5,
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  safetyTagText: {
    color: "#4A6572",
    fontSize: 9.5,
    fontWeight: "600",
  },

  /* Time Window Slots */
  timeSlotsGrid: {
    gap: 8,
  },
  timeSlotCard: {
    backgroundColor: "#F9FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  timeSlotCardActive: {
    backgroundColor: "#FFF8F0",
    borderColor: "#E65100",
  },
  timeSlotTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeSlotTitle: {
    color: colors.ink,
    fontSize: 12.5,
    fontWeight: "700",
  },
  timeSlotTitleActive: {
    color: "#BF360C",
  },
  timeSlotDesc: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
    paddingLeft: 21,
  },

  /* Buyer Note Input */
  notesInput: {
    backgroundColor: "#F6F8FB",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 13,
  },
  notesCharCount: {
    color: colors.muted,
    fontSize: 10.5,
    textAlign: "right",
    marginTop: 4,
  },

  /* Promo Box */
  promoInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  promoInput: {
    flex: 1,
    backgroundColor: "#F6F8FB",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  promoApplyBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  promoApplyBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  suggestedPromoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  suggestedPromoLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  promoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF4E5",
    borderWidth: 1,
    borderColor: "#FFE0B2",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  promoChipText: {
    color: "#E65100",
    fontSize: 11.5,
    fontWeight: "800",
  },
  promoChipSub: {
    color: "#F57C00",
    fontSize: 10,
    fontWeight: "600",
  },
  promoErrorText: {
    color: colors.red,
    fontSize: 12,
    marginTop: 6,
  },
  promoSuccessText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  appliedPromoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EDF8F2",
    borderWidth: 1,
    borderColor: "#C3E6CB",
    borderRadius: 12,
    padding: 10,
  },
  appliedPromoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promoTagIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  appliedPromoCode: {
    color: "#155724",
    fontSize: 13,
    fontWeight: "800",
  },
  appliedPromoLabel: {
    color: "#28A745",
    fontSize: 11.5,
    marginTop: 1,
  },
  removePromoBtn: {},

  /* Price Summary Breakdown */
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  sumLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sumLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  sumVal: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  savingsLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  freeBadge: {
    backgroundColor: "#E8F8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
  },
  dashedDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.line,
    marginVertical: 10,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 4,
  },
  totalLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  totalMeta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  totalValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  savingsHighlightBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDF8F2",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  savingsHighlightText: {
    color: "#155724",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },

  /* Campus Buyer Guarantee */
  protectionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#F8FAFD",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  protectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  protectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  protectionDesc: {
    color: colors.muted,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },

  /* Sticky/Bottom Checkout Bar */
  checkoutBar: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  checkoutMeta: {},
  checkoutMetaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  checkoutMetaAmount: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  checkoutButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },

  /* Review Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  modalSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewLogisticsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  reviewLogisticsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  reviewIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewLogisticsLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  reviewLogisticsValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 1,
  },
  reviewLogisticsSub: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 1,
  },
  reviewLogisticsDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },
  reviewItemsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  reviewItemsTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  reviewItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  reviewItemQty: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  reviewItemTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
  },
  reviewItemPrice: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  reviewDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  reviewTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewTotalLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  reviewTotalVal: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  reviewSavingsNotice: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  reviewSafetyBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  reviewSafetyText: {
    flex: 1,
    color: "#2E7D32",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelBtnText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  modalConfirmBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
