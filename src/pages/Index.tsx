import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const ORDERS_API_URL = 'https://functions.poehali.dev/1c44ecd2-af19-46df-b9a6-48f722a5f594';

interface User {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  role: string;
}

interface Ticket {
  id: string;
  type: string;
  price: number;
  available: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  image: string;
  tickets: Ticket[];
}

interface CartItem {
  eventId: string;
  eventTitle: string;
  ticketId: string;
  ticketType: string;
  price: number;
  quantity: number;
}

interface Promo {
  id: string;
  code: string;
  discount: number;
  active: boolean;
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Концерт джазового оркестра',
    date: '15 января 2025',
    location: 'Концертный зал "Филармония"',
    category: 'Музыка',
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
    tickets: [
      { id: 't1', type: 'VIP', price: 5000, available: 20 },
      { id: 't2', type: 'Партер', price: 3000, available: 50 },
      { id: 't3', type: 'Балкон', price: 1500, available: 100 }
    ]
  },
  {
    id: '2',
    title: 'Театральная постановка "Гамлет"',
    date: '20 января 2025',
    location: 'Драматический театр',
    category: 'Театр',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
    tickets: [
      { id: 't4', type: 'Премиум', price: 4000, available: 30 },
      { id: 't5', type: 'Стандарт', price: 2000, available: 80 }
    ]
  },
  {
    id: '3',
    title: 'Выставка современного искусства',
    date: '25 января 2025',
    location: 'Музей искусств',
    category: 'Искусство',
    image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800',
    tickets: [
      { id: 't6', type: 'Входной билет', price: 800, available: 200 }
    ]
  }
];

const salesData = [
  { month: 'Июл', sales: 4200 },
  { month: 'Авг', sales: 5300 },
  { month: 'Сен', sales: 6800 },
  { month: 'Окт', sales: 5900 },
  { month: 'Ноя', sales: 7200 },
  { month: 'Дек', sales: 8500 }
];

const categoryData = [
  { category: 'Музыка', count: 145 },
  { category: 'Театр', count: 98 },
  { category: 'Искусство', count: 67 },
  { category: 'Спорт', count: 120 }
];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [promos, setPromos] = useState<Promo[]>([
    { id: '1', code: 'WELCOME20', discount: 20, active: true },
    { id: '2', code: 'SUMMER50', discount: 50, active: false }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('');

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutFullName, setCheckoutFullName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');

  const addToCart = (event: Event, ticket: Ticket) => {
    const existingItem = cart.find(
      item => item.eventId === event.id && item.ticketId === ticket.id
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.eventId === event.id && item.ticketId === ticket.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        eventId: event.id,
        eventTitle: event.title,
        ticketId: ticket.id,
        ticketType: ticket.type,
        price: ticket.price,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (eventId: string, ticketId: string) => {
    setCart(cart.filter(item => !(item.eventId === eventId && item.ticketId === ticketId)));
  };

  const updateQuantity = (eventId: string, ticketId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(eventId, ticketId);
    } else {
      setCart(cart.map(item =>
        item.eventId === eventId && item.ticketId === ticketId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const createEvent = () => {
    if (newEventTitle && newEventDate && newEventLocation && newEventCategory) {
      const newEvent: Event = {
        id: Date.now().toString(),
        title: newEventTitle,
        date: newEventDate,
        location: newEventLocation,
        category: newEventCategory,
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        tickets: [
          { id: `t${Date.now()}`, type: 'Стандарт', price: 1000, available: 100 }
        ]
      };
      setEvents([...events, newEvent]);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventLocation('');
      setNewEventCategory('');
    }
  };

  const createPromo = () => {
    if (newPromoCode && newPromoDiscount) {
      const newPromo: Promo = {
        id: Date.now().toString(),
        code: newPromoCode.toUpperCase(),
        discount: parseInt(newPromoDiscount),
        active: true
      };
      setPromos([...promos, newPromo]);
      setNewPromoCode('');
      setNewPromoDiscount('');
    }
  };

  const togglePromo = (id: string) => {
    setPromos(promos.map(promo =>
      promo.id === id ? { ...promo, active: !promo.active } : promo
    ));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderLoading(true);

    try {
      const response = await fetch(ORDERS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: checkoutFullName,
          email: checkoutEmail,
          phone: checkoutPhone,
          cart_items: cart,
          total_amount: cartTotal
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Заказ оформлен!',
          description: data.email_sent 
            ? `Билеты отправлены на ${checkoutEmail}` 
            : 'Заказ создан, проверьте настройки SMTP для отправки билетов'
        });
        setCart([]);
        setShowCheckout(false);
        setCheckoutFullName('');
        setCheckoutEmail('');
        setCheckoutPhone('');
      } else {
        toast({
          title: 'Ошибка оформления',
          description: data.error || 'Не удалось оформить заказ',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Icon name="Ticket" className="text-primary-foreground" size={24} />
              </div>
              <h1 className="text-2xl font-bold">EventHub</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Icon name="User" size={20} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Профиль</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="User" size={32} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Статистика</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                          <p className="text-2xl font-bold">12</p>
                          <p className="text-xs text-muted-foreground">Куплено билетов</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <p className="text-2xl font-bold">8</p>
                          <p className="text-xs text-muted-foreground">Посещено событий</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="w-full">
                      <Icon name="LogOut" size={18} className="mr-2" />
                      Выйти
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              ) : (
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Войти
                </Button>
              )}

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Icon name="ShoppingCart" size={20} />
                    {cartItemsCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {cartItemsCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Корзина</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <Icon name="ShoppingBag" size={48} className="mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Корзина пуста</p>
                      </div>
                    ) : (
                      <>
                        {cart.map((item) => (
                          <Card key={`${item.eventId}-${item.ticketId}`} className="p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{item.eventTitle}</p>
                                  <p className="text-xs text-muted-foreground">{item.ticketType}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeFromCart(item.eventId, item.ticketId)}
                                >
                                  <Icon name="X" size={16} />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.eventId, item.ticketId, item.quantity - 1)}
                                  >
                                    <Icon name="Minus" size={14} />
                                  </Button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.eventId, item.ticketId, item.quantity + 1)}
                                  >
                                    <Icon name="Plus" size={14} />
                                  </Button>
                                </div>
                                <p className="font-bold">{item.price * item.quantity} ₽</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                        <div className="border-t pt-4 space-y-4">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Итого:</span>
                            <span>{cartTotal} ₽</span>
                          </div>
                          <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
                            <DialogTrigger asChild>
                              <Button className="w-full" size="lg">
                                Оформить заказ
                                <Icon name="ArrowRight" size={18} className="ml-2" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Оформление заказа</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleCheckout} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="checkout-name">ФИО</Label>
                                  <Input
                                    id="checkout-name"
                                    type="text"
                                    placeholder="Иван Иванов"
                                    value={checkoutFullName}
                                    onChange={(e) => setCheckoutFullName(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="checkout-email">Email</Label>
                                  <Input
                                    id="checkout-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={checkoutEmail}
                                    onChange={(e) => setCheckoutEmail(e.target.value)}
                                    required
                                  />
                                  <p className="text-xs text-muted-foreground">Билеты будут отправлены на этот email</p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="checkout-phone">Номер телефона</Label>
                                  <Input
                                    id="checkout-phone"
                                    type="tel"
                                    placeholder="+7 999 123-45-67"
                                    value={checkoutPhone}
                                    onChange={(e) => setCheckoutPhone(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="border-t pt-4">
                                  <div className="flex justify-between mb-4">
                                    <span className="font-semibold">Итого к оплате:</span>
                                    <span className="font-bold text-lg text-primary">{cartTotal} ₽</span>
                                  </div>
                                  <Button type="submit" className="w-full" size="lg" disabled={orderLoading}>
                                    {orderLoading ? (
                                      <>
                                        <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                                        Оформление...
                                      </>
                                    ) : (
                                      <>
                                        <Icon name="Check" size={18} className="mr-2" />
                                        Подтвердить заказ
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {user && user.role === 'admin' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Icon name="Settings" size={20} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Административная панель</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="events" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="events">Мероприятия</TabsTrigger>
                      <TabsTrigger value="promos">Промокоды</TabsTrigger>
                      <TabsTrigger value="analytics">Аналитика</TabsTrigger>
                    </TabsList>

                    <TabsContent value="events" className="space-y-4 mt-4">
                      <Card className="p-4">
                        <h3 className="font-semibold mb-4">Создать мероприятие</h3>
                        <div className="grid gap-4">
                          <div>
                            <Label>Название</Label>
                            <Input
                              value={newEventTitle}
                              onChange={(e) => setNewEventTitle(e.target.value)}
                              placeholder="Название мероприятия"
                            />
                          </div>
                          <div>
                            <Label>Дата</Label>
                            <Input
                              value={newEventDate}
                              onChange={(e) => setNewEventDate(e.target.value)}
                              placeholder="15 января 2025"
                            />
                          </div>
                          <div>
                            <Label>Место проведения</Label>
                            <Input
                              value={newEventLocation}
                              onChange={(e) => setNewEventLocation(e.target.value)}
                              placeholder="Концертный зал"
                            />
                          </div>
                          <div>
                            <Label>Категория</Label>
                            <Select value={newEventCategory} onValueChange={setNewEventCategory}>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите категорию" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Музыка">Музыка</SelectItem>
                                <SelectItem value="Театр">Театр</SelectItem>
                                <SelectItem value="Искусство">Искусство</SelectItem>
                                <SelectItem value="Спорт">Спорт</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={createEvent}>
                            <Icon name="Plus" size={18} className="mr-2" />
                            Создать мероприятие
                          </Button>
                        </div>
                      </Card>

                      <div className="space-y-2">
                        <h3 className="font-semibold">Список мероприятий ({events.length})</h3>
                        {events.map((event) => (
                          <Card key={event.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{event.title}</p>
                                <p className="text-sm text-muted-foreground">{event.date} • {event.location}</p>
                                <Badge variant="secondary" className="mt-2">{event.category}</Badge>
                              </div>
                              <Button variant="ghost" size="icon">
                                <Icon name="MoreVertical" size={18} />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="promos" className="space-y-4 mt-4">
                      <Card className="p-4">
                        <h3 className="font-semibold mb-4">Создать промокод</h3>
                        <div className="grid gap-4">
                          <div>
                            <Label>Код</Label>
                            <Input
                              value={newPromoCode}
                              onChange={(e) => setNewPromoCode(e.target.value)}
                              placeholder="PROMO2025"
                            />
                          </div>
                          <div>
                            <Label>Скидка (%)</Label>
                            <Input
                              type="number"
                              value={newPromoDiscount}
                              onChange={(e) => setNewPromoDiscount(e.target.value)}
                              placeholder="20"
                            />
                          </div>
                          <Button onClick={createPromo}>
                            <Icon name="Plus" size={18} className="mr-2" />
                            Создать промокод
                          </Button>
                        </div>
                      </Card>

                      <div className="space-y-2">
                        <h3 className="font-semibold">Активные промокоды ({promos.filter(p => p.active).length})</h3>
                        {promos.map((promo) => (
                          <Card key={promo.id} className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold font-mono">{promo.code}</p>
                                <p className="text-sm text-muted-foreground">Скидка {promo.discount}%</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={promo.active ? "default" : "secondary"}>
                                  {promo.active ? 'Активен' : 'Неактивен'}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => togglePromo(promo.id)}
                                >
                                  {promo.active ? 'Деактивировать' : 'Активировать'}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4 mt-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon name="TrendingUp" className="text-primary" size={20} />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">8,542</p>
                              <p className="text-xs text-muted-foreground">Продано билетов</p>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon name="DollarSign" className="text-primary" size={20} />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">2.4M ₽</p>
                              <p className="text-xs text-muted-foreground">Общая выручка</p>
                            </div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon name="Users" className="text-primary" size={20} />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">1,234</p>
                              <p className="text-xs text-muted-foreground">Активных клиентов</p>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <Card className="p-4">
                        <h3 className="font-semibold mb-4">Продажи по месяцам</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="month" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>

                      <Card className="p-4">
                        <h3 className="font-semibold mb-4">Популярные категории</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="category" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-4xl font-bold mb-2">Найдите свое событие</h2>
          <p className="text-muted-foreground">Билеты на концерты, театр, выставки и спортивные мероприятия</p>
        </div>

        <div className="mb-8 space-y-4 animate-fade-in">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Поиск по названию или месту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="Музыка">Музыка</SelectItem>
                <SelectItem value="Театр">Театр</SelectItem>
                <SelectItem value="Искусство">Искусство</SelectItem>
                <SelectItem value="Спорт">Спорт</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('all')}
            >
              Все
            </Badge>
            {['Музыка', 'Театр', 'Искусство', 'Спорт'].map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="aspect-video overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-xl">{event.title}</h3>
                    <Badge variant="secondary">{event.category}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={16} />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="MapPin" size={16} />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Типы билетов:</p>
                  {event.tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{ticket.type}</p>
                        <p className="text-xs text-muted-foreground">Доступно: {ticket.available}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold">{ticket.price} ₽</p>
                        <Button size="sm" onClick={() => addToCart(event, ticket)}>
                          <Icon name="Plus" size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Мероприятия не найдены</p>
          </div>
        )}
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="Ticket" className="text-primary-foreground" size={16} />
                </div>
                <span className="font-bold">EventHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Платформа для продажи билетов на мероприятия
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">О платформе</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>О нас</li>
                <li>Контакты</li>
                <li>Вакансии</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Организаторам</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Создать событие</li>
                <li>Аналитика</li>
                <li>Поддержка</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Icon name="Mail" size={16} />
                  <span>info@eventhub.ru</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Phone" size={16} />
                  <span>+7 (495) 123-45-67</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 EventHub. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;